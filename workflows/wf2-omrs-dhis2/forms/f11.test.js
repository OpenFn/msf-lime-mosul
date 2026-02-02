import test from "node:test";
import { deepEqual } from "node:assert";
import f11 from "./f11.js";

import state from "../.cli-cache/f11-state.json" with { type: "json" };

// TODO copy the encounter object into this file
// TODO how do we build/get the opts map?

test("should run form f11", () => {
  const result = f11(state.encounters[0], state.optsMap);

  const expected = [
    {
      dataElement: "DYTLOoEKRas",
      value: "vasectomy",
    },
    {
      dataElement: "ddTrzQtQUGz",
      value: undefined,
    },
    {
      dataElement: "fuNs3Uzspsm",
      value: undefined,
    },
  ];
  deepEqual(result, expected);
});

// should ignore forms without the correct name
// should only map observations with correct concept id
// something about mapping values
// need to test all 3 data elements
// what happens if there's no mapped answer?
