import test from "node:test";
import { deepEqual } from "node:assert";
import f22 from "./f22.js";

import state from "./f22-state.json" with { type: "json" };

const e1 = {
  uuid: "f0c4dedf-8981-47fa-9819-ab5dc258acfd",
  patient: {
    uuid: "3058aa3d-f889-458b-a177-63ad1c0b1363",
    display: "IQ146-26-000-028 - Joe Tuch",
  },
  obs: [],
  form: {
    uuid: "18827232-356b-3fad-884c-de3bcca2b0a4",
    display: "F22-Neonatal Delivery",
    description: "MSF Form - F22-Neonatal Delivery",
    name: "F22-Neonatal Delivery",
  },
  encounterDatetime: "2026-01-30T13:51:55.000+0000",
};

const e2 = {
  uuid: "f0c4dedf-8981-47fa-9819-ab5dc258acfd",
  patient: {
    uuid: "3058aa3d-f889-458b-a177-63ad1c0b1363",
    display: "IQ146-26-000-028 - Joe Tuch",
  },
  obs: [
    {
      uuid: "7433d567-f024-48cf-8588-091026271dcb",
      concept: {
        uuid: "38d5dcf5-b8bf-420e-bb14-a270e1f518b3",
        display: "Neonatal resuscitation",
      },
      display: "Neonatal resuscitation: Cardiac massage",
      formFieldPath: "rfe-forms-ressuscitationAtBirth",
      value: {
        uuid: "77e95168-3ca1-4a28-9b23-26a1339c1afa",
        display: "Cardiac massage",
        name: {
          display: "Cardiac massage",
          uuid: "81a5c9c4-831d-421d-8c94-2244a27151bb",
          name: "Cardiac massage",
          locale: "en",
          localePreferred: true,
          conceptNameType: "FULLY_SPECIFIED",
          resourceVersion: "1.9",
        },
        datatype: {
          uuid: "8d4a4c94-c2cc-11de-8d13-0010c6dffd0f",
          display: "N/A",
        },
        conceptClass: {
          uuid: "8d492774-c2cc-11de-8d13-0010c6dffd0f",
          display: "Misc",
        },
        set: false,
        retired: false,
        names: [
          {
            uuid: "81a5c9c4-831d-421d-8c94-2244a27151bb",
            display: "Cardiac massage",
          },
        ],
        descriptions: [],
        mappings: [],
        answers: [],
        setMembers: [],
        attributes: [],
        resourceVersion: "2.0",
      },
      person: {
        uuid: "3058aa3d-f889-458b-a177-63ad1c0b1363",
        display: "IQ146-26-000-028 - Joe Tuch",
      },
    },
  ],
  form: {
    uuid: "18827232-356b-3fad-884c-de3bcca2b0a4",
    display: "F22-Neonatal Delivery",
    description: "MSF Form - F22-Neonatal Delivery",
    name: "F22-Neonatal Delivery",
  },
  encounterDatetime: "2026-01-30T13:51:55.000+0000",
};

test("should return undefined if there are no matching concepts", () => {
  const result = f22(e1);

  const expected = undefined;
  deepEqual(result, expected);
});

test("should map [one observation]", () => {
  const result = f22(e1);

  const expected = {};
  deepEqual(result, expected);
});
