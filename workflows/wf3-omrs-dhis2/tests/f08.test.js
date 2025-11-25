import assert from "node:assert";
import { describe, it } from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import importJob from "../../../importer.js";

const f8EncounterFile = new URL(
  "./test-data/f08-encounter.json",
  import.meta.url
);
const f08Encounter = JSON.parse(await readFile(f8EncounterFile, "utf8"));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { f8 } = await importJob(
  path.join(__dirname, "../custom-logic-for-events.js")
);

describe("f8", () => {
  it("should return an array of data values", () => {
    const res = f8(f08Encounter);
    assert.equal(res.length, 2);
    assert.deepEqual(res[0], {
      dataElement: "iQio7NYSA3m",
      value: "2025-11-21",
    });
  });
});
