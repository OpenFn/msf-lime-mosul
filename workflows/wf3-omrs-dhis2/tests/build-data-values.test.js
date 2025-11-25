import assert from "node:assert";
import { describe, it } from "node:test";
import { readFileAsJSON, relativePathToFile } from "./util.js";
import importJob from "../../../importer.js";

const tei = await readFileAsJSON("./test-data/tei.json");
const encounters = await readFileAsJSON("./test-data/f08-encounters.json");
const { optsMap, optionSetKey, formMaps } = await readFileAsJSON(
  "./test-data/metadata.json"
);

const jobPath = relativePathToFile("../custom-logic-for-events.js");
const { buildDataValues } = await importJob(jobPath);

describe("buildDataValues", () => {
  it("should return an array of data values", () => {
    const encounterForm = formMaps[encounters[0].form.uuid];
    const res = buildDataValues(encounters[0], encounterForm, {
      optsMap,
      optionSetKey,
      tei,
    });

    assert(res.length > 0, "We have at least one data value");
  });
});
