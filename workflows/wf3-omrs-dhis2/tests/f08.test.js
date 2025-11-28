import assert from "node:assert";
import { describe, it } from "node:test";

import importJob from "../../../importer.js";
import { readFileAsJSON, relativePathToFile } from "./util.js";

const f08Encounter = await readFileAsJSON("./test-data/f08-encounters.json");
const withAdmissionDate = f08Encounter[1];
const withoutAdmissionDate = f08Encounter[0];

const jobFile = relativePathToFile("../custom-logic-for-events.js");
const { f8 } = await importJob(jobFile);

describe("f8", () => {
  it("should return an array of data values if admission date is present", () => {
    const res = f8(withAdmissionDate);
    assert.equal(res.length, 2);
    assert.deepEqual(res[1], {
      dataElement: "yprMS34o8s3",
      value: "2025-11-05",
    });
  });
  it("should return empty array if admission date is not present", () => {
    const res = f8(withoutAdmissionDate);
    assert.equal(res.length, 0);
    assert.deepEqual(res, []);
  });
});
