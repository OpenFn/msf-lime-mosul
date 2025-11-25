import { describe, it } from "node:test";
import importJob from "../../../importer.js";
import f08Encounter from "./test-data/f08-encounter.json" with { type: "json" };
const { f08 } = await importJob("../custom-logic-for-events.js");

describe("f08", () => {
  it("should return an array of data values", () => {
    const res = f08(f08Encounter);

    expect(res).toEqual([
      {
        dataElement: "iQio7NYSA3m",
        value: "01/01/2022",
      },
      {
        dataElement: "yprMS34o8s3",
        value: "",
      },
    ]);
  });
});