import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const readFileAsJSON = async (filePath) => {
  const fileUrl = new URL(filePath, import.meta.url);
  return JSON.parse(await readFile(fileUrl, "utf8"));
};

export const relativePathToFile = (filePath) => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.join(__dirname, filePath);
};
