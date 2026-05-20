#!/usr/bin/env node
/**
 * prepare-tests.mjs
 *
 * Compiles OpenFn workflows and extracts named-export functions into
 * test-friendly JS files that mirror the workflows/ folder structure under
 * tests/.
 *
 * Works with any project that has a workflows/ directory and the openfn CLI.
 * Requires acorn (ships as a transitive dep of @openfn/cli).
 *
 * Usage (run from project root):
 *   node scripts/prepare-tests.mjs [options] [workflows-dir] [tests-dir]
 *
 * Options:
 *   --save-json   Also write the compiled workflow JSON to tests/<wf>/<wf>.json
 *
 * Outputs per step that has named exports:
 *   tests/<workflow-name>/<step-id>.js        — cleaned-up exports file
 *   tests/<workflow-name>/<step-id>.test.js   — test skeleton (skipped if exists)
 */

import { execSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = process.cwd();
const flags = new Set(process.argv.slice(2).filter(a => a.startsWith('--')));
const positional = process.argv.slice(2).filter(a => !a.startsWith('--'));

const saveJson = flags.has('--save-json');

const workflowsDir = positional[0]
  ? path.resolve(projectRoot, positional[0])
  : path.join(projectRoot, 'workflows');

const testsDir = positional[1]
  ? path.resolve(projectRoot, positional[1])
  : path.join(projectRoot, 'tests');

// ── Acorn loader ──────────────────────────────────────────────────────────────

async function loadAcorn() {
  const roots = [
    projectRoot,
    path.resolve(__dirname, '..'),
    path.resolve(__dirname, '../..'),
    path.resolve(__dirname, '../../..'),
  ];

  for (const root of [...new Set(roots)]) {
    const p = path.join(root, 'node_modules', 'acorn', 'dist', 'acorn.mjs');
    if (existsSync(p)) {
      try {
        const mod = await import(`file://${p}`);
        const parse = mod.parse || mod.default?.parse;
        if (typeof parse === 'function') return parse;
      } catch {}
    }
  }

  try {
    const { parse } = await import('acorn');
    if (typeof parse === 'function') return parse;
  } catch {}

  return null;
}

// ── File-system helpers ───────────────────────────────────────────────────────

function findWorkflowDirs(dir) {
  if (!existsSync(dir)) {
    console.error(`Error: workflows directory not found: ${dir}`);
    process.exit(1);
  }
  return readdirSync(dir)
    .filter(n => !n.startsWith('.'))
    .map(n => ({ name: n, fullPath: path.join(dir, n) }))
    .filter(({ fullPath }) => statSync(fullPath).isDirectory());
}

function findYamlFile(dir) {
  const found = readdirSync(dir).find(
    f => f.endsWith('.yaml') || f.endsWith('.yml')
  );
  return found ? path.join(dir, found) : null;
}

// ── AST helpers ───────────────────────────────────────────────────────────────

const SKIP_KEYS = new Set(['type', 'start', 'end', 'loc', 'range']);

/** Collect all Identifier names in an AST subtree. */
function collectIdentifiers(node, ids = new Set()) {
  if (!node || typeof node !== 'object') return ids;
  if (Array.isArray(node)) { node.forEach(n => collectIdentifiers(n, ids)); return ids; }
  if (node.type === 'Identifier') ids.add(node.name);
  for (const [key, val] of Object.entries(node)) {
    if (SKIP_KEYS.has(key) || !val || typeof val !== 'object') continue;
    collectIdentifiers(val, ids);
  }
  return ids;
}

/** Names declared by a VariableDeclaration / FunctionDeclaration / ClassDeclaration. */
function getDeclaredNames(node) {
  if (node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') {
    return node.id ? [node.id.name] : [];
  }
  if (node.type === 'VariableDeclaration') {
    const names = [];
    node.declarations.forEach(d => extractPatternNames(d.id, names));
    return names;
  }
  return [];
}

function extractPatternNames(node, out = []) {
  if (!node) return out;
  if (node.type === 'Identifier') { out.push(node.name); return out; }
  if (node.type === 'ObjectPattern')
    node.properties.forEach(p => extractPatternNames(p.value || p.argument, out));
  if (node.type === 'ArrayPattern')
    node.elements.forEach(e => e && extractPatternNames(e, out));
  return out;
}

/** Names that a named export declaration exposes. */
function getExportedNames(namedExportNodes) {
  const names = [];
  for (const node of namedExportNodes) {
    const decl = node.declaration;
    if (!decl) continue;
    if (decl.type === 'FunctionDeclaration' || decl.type === 'ClassDeclaration') {
      if (decl.id) names.push(decl.id.name);
    } else if (decl.type === 'VariableDeclaration') {
      decl.declarations.forEach(d => extractPatternNames(d.id, names));
    }
  }
  return names;
}

/**
 * Rebuild an import statement keeping only the specifiers whose local names
 * appear in `usedIds`. Returns null if nothing from this import is used.
 */
function filterImport(node, usedIds) {
  if (node.type === 'ExportAllDeclaration') return null; // always remove

  // Side-effect import (no specifiers): keep as-is
  if (node.specifiers.length === 0) {
    return `import ${JSON.stringify(node.source.value)};`;
  }

  const kept = node.specifiers.filter(s => usedIds.has(s.local.name));
  if (kept.length === 0) return null;

  const specs = kept.map(s => {
    if (s.type === 'ImportDefaultSpecifier') return s.local.name;
    if (s.type === 'ImportNamespaceSpecifier') return `* as ${s.local.name}`;
    // ImportSpecifier
    const imp = s.imported.type === 'Identifier' ? s.imported.name : s.imported.value;
    return imp === s.local.name ? imp : `${imp} as ${s.local.name}`;
  });

  return `import { ${specs.join(', ')} } from ${JSON.stringify(node.source.value)};`;
}

// ── Core extraction ───────────────────────────────────────────────────────────

/**
 * Parse a compiled step expression and return:
 *   { code, exportedNames }  — the cleaned-up JS and the list of export names
 *   null if the step has no named exports
 */
function extractExports(source, acornParse) {
  let ast;
  try {
    ast = acornParse(source, { ecmaVersion: 'latest', sourceType: 'module' });
  } catch (err) {
    console.warn(`    Parse warning: ${err.message}`);
    return null;
  }

  const importNodes = [];   // ImportDeclaration | ExportAllDeclaration
  const namedExportNodes = [];
  const declNodes = [];     // top-level non-export declarations

  for (const node of ast.body) {
    switch (node.type) {
      case 'ImportDeclaration':
      case 'ExportAllDeclaration':
        importNodes.push(node);
        break;
      case 'ExportNamedDeclaration':
        if (node.declaration) namedExportNodes.push(node);
        break;
      case 'ExportDefaultDeclaration':
        break; // the compiled pipeline — skip
      case 'VariableDeclaration':
      case 'FunctionDeclaration':
      case 'ClassDeclaration':
        declNodes.push(node);
        break;
    }
  }

  if (namedExportNodes.length === 0) return null;

  // Collect identifiers referenced by exports
  const usedIds = new Set();
  namedExportNodes.forEach(n => collectIdentifiers(n, usedIds));

  // Transitively pull in non-export declarations that exports depend on
  const includedDecls = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of declNodes) {
      if (includedDecls.includes(node)) continue;
      if (getDeclaredNames(node).some(n => usedIds.has(n))) {
        includedDecls.push(node);
        collectIdentifiers(node, usedIds);
        changed = true;
      }
    }
  }

  // Also collect identifiers from included deps before filtering imports
  includedDecls.forEach(n => collectIdentifiers(n, usedIds));

  // Build filtered import lines (drop unused specifiers and export * re-exports)
  const importLines = importNodes
    .map(n => filterImport(n, usedIds))
    .filter(Boolean);

  const chunks = [];

  if (importLines.length > 0) {
    importLines.forEach(l => chunks.push(l));
    chunks.push('');
  }

  if (includedDecls.length > 0) {
    includedDecls.forEach(n => chunks.push(source.slice(n.start, n.end)));
    chunks.push('');
  }

  namedExportNodes.forEach(n => chunks.push(source.slice(n.start, n.end)));

  return {
    code: chunks.join('\n'),
    exportedNames: getExportedNames(namedExportNodes),
  };
}

// ── Test skeleton generator ───────────────────────────────────────────────────

function buildTestSkeleton(stepId, exportedNames) {
  const namedImports = exportedNames.map(n => `  ${n},`).join('\n');
  return [
    `import { describe, it } from 'node:test';`,
    `import assert from 'node:assert/strict';`,
    ``,
    `import {`,
    namedImports,
    `} from './${stepId}.js';`,
    ``,
    `describe('${stepId}', () => {`,
    `  // TODO: add tests`,
    `});`,
    ``,
  ].join('\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const acornParse = await loadAcorn();
  if (!acornParse) {
    console.error(
      'Error: acorn not found.\n' +
      'Install it: npm i -D acorn\n' +
      'Or ensure @openfn/cli is installed (it includes acorn as a transitive dep).'
    );
    process.exit(1);
  }

  const wfDirs = findWorkflowDirs(workflowsDir);
  if (wfDirs.length === 0) {
    console.log(`No workflow directories found in ${workflowsDir}`);
    return;
  }

  console.log(`Found ${wfDirs.length} workflow(s) in ${workflowsDir}\n`);

  for (const { name: wfName, fullPath: wfDir } of wfDirs) {
    const yamlFile = findYamlFile(wfDir);
    if (!yamlFile) {
      console.warn(`Skipping ${wfName}: no YAML file found`);
      continue;
    }

    const outputDir = path.join(testsDir, wfName);
    mkdirSync(outputDir, { recursive: true });

    // Compile the workflow
    console.log(`Compiling ${wfName}...`);
    // Always compile to a file (avoids CLI log noise mixed into stdout).
    // If --save-json, keep it in the output dir; otherwise use a temp file.
    const jsonPath = saveJson
      ? path.join(outputDir, `${wfName}.json`)
      : path.join(os.tmpdir(), `openfn-${wfName}-${Date.now()}.json`);

    let compiledJson;
    try {
      execSync(`openfn compile "${yamlFile}" -o "${jsonPath}"`, {
        cwd: projectRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      compiledJson = readFileSync(jsonPath, 'utf8');
    } catch (err) {
      const msg = (err.stderr?.toString() || err.stdout?.toString() || err.message)
        .split('\n')
        .filter(Boolean)[0];
      console.error(`  Compile failed: ${msg}`);
      continue;
    } finally {
      if (!saveJson && existsSync(jsonPath)) unlinkSync(jsonPath);
    }

    let compiled;
    try {
      compiled = JSON.parse(compiledJson);
    } catch (err) {
      console.error(`  Could not parse compiled output: ${err.message}`);
      continue;
    }

    const steps = compiled.workflow?.steps ?? [];
    let written = 0;

    for (const step of steps) {
      if (!step.expression || !step.id) continue;

      const result = extractExports(step.expression, acornParse);
      if (!result) continue;

      const jsFile = path.join(outputDir, `${step.id}.js`);
      writeFileSync(jsFile, result.code + '\n');

      const testFile = path.join(outputDir, `${step.id}.test.js`);
      if (!existsSync(testFile)) {
        writeFileSync(testFile, buildTestSkeleton(step.id, result.exportedNames));
        console.log(`  ${step.id}.js + ${step.id}.test.js  [${result.exportedNames.join(', ')}]`);
      } else {
        console.log(`  ${step.id}.js  [${result.exportedNames.join(', ')}]  (test file already exists)`);
      }

      written++;
    }

    if (written === 0) console.log('  (no steps with named exports)');
    console.log();
  }

  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
