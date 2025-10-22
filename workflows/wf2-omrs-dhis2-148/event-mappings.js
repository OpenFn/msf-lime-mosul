const findAnswerByConcept = (encounter, conceptUuid) => {
  const answer = encounter.obs.find((o) => o.concept.uuid === conceptUuid);
  return answer?.value?.display;
};

// Helper functions for finding observations
const findObsByConcept = (encounter, conceptUuid) => {
  const [conceptId, questionId] = conceptUuid.split("-rfe-");
  const answer = encounter.obs.find(
    (o) =>
      o.concept.uuid === conceptId &&
      (questionId ? o.formFieldPath === `rfe-${questionId}` : true)
  );
  return answer;
};

const filterObsByConcept = (encounter, conceptUuid) => {
  const [conceptId, questionId] = conceptUuid.split("-rfe-");
  const answers = encounter.obs.filter(
    (o) =>
      o.concept.uuid === conceptId &&
      (questionId ? o.formFieldPath === `rfe-${questionId}` : true)
  );
  return answers;
};
function f11(encounter, optsMap) {
  if (encounter.form.description.includes("F11-Family Planning Assessment")) {
    const answers = encounter.obs.filter(
      (o) => o.concept.uuid === "30b2d692-6a05-401f-8ede-13e027b8a436"
    );

    const mappingConfig = [
      { dataElement: "DYTLOoEKRas", index: 0 },
      { dataElement: "ddTrzQtQUGz", index: 1 },
      { dataElement: "fuNs3Uzspsm", index: 2 },
    ];

    return mappingConfig.map((config) => {
      if (answers[config.index]) {
        return {
          dataElement: config.dataElement,
          value: optsMap.find(
            (o) =>
              o["value.display - Answers"] ===
              answers[config.index]?.value?.display
          )?.["DHIS2 Option Code"],
        };
      }
    });
  }
}
function f13(encounter, optsMap) {
  if (encounter.form.description.includes("F13-PNC")) {
    const answers = encounter.obs.filter(
      (o) => o.concept.uuid === "22809b19-54ca-4d88-8d26-9577637c184e"
    );

    // Define mapping configurations
    const mappingConfig = [
      { dataElement: "ErtqJsZINyX", index: 0 },
      { dataElement: "wWAMdsjks50", index: 1 },
      { dataElement: "Dh1ocjojOrC", index: 2 },
      { dataElement: "KR03PHkzVw1", index: 3 },
      { dataElement: "kDA55sgLAwY", index: 4 },
    ];

    // Only add mappings for answers that exist
    return mappingConfig.map((config) => {
      if (answers[config.index] !== undefined) {
        return {
          dataElement: config.dataElement,
          value: optsMap.find(
            (o) =>
              o["value.display - Answers"] ===
              answers[config.index]?.value?.display
          )?.["DHIS2 Option Code"],
        };
      }
    });
  }
}

function f16(encounter) {
  const answers = encounter.obs.filter(
    (o) => o.concept.uuid === "877aa979-c02f-4890-8156-836d52696f09"
  );

  if (encounter.form.description.includes("F16-Operative Report") && answers) {
    const [date, time] = encounter.encounterDatetime.split("T");
    return [
      {
        dataElement: "ZQgbPvQ7dWC",
        value: date,
      },
      {
        dataElement: "onsyxszD8X7",
        value: time,
      },
    ];
  }
  return;
}

function f17(encounter) {
  const mappings = [];
  if (
    encounter.form.description.includes("F17-Surgery Admission") &&
    findObsByConcept(encounter, "13d4d6b8-0cd3-46c5-be7b-c3a7565aaca7")
  ) {
    mappings.push({
      dataElement: "hMqZO0MIIT1",
      value: "hours",
    });
  }
  if (
    encounter.form.description.includes("F17-Surgery Admission") &&
    findObsByConcept(encounter, "7f00c65d-de60-467a-8964-fe80c7a85ef0")
  ) {
    const [date, time] = encounter.encounterDatetime.split("T");
    mappings.push(
      {
        dataElement: "DEGa7RaIDTo",
        value: date,
      },
      {
        dataElement: "aUSp8oQZIWu",
        value: date,
      },
      {
        dataElement: "mDOUf2zzwS2",
        value: time,
      }
    );
  }
  return mappings;
}

function f18(encounter, encounters) {
  const isDischarge = findObsByConcept(
    encounter,
    "13cea1c8-e426-411f-95b4-33651fc4325d"
  );

  if (
    encounter.form.description.includes("F18-Surgery Discharge") &&
    isDischarge
  ) {
    const lastAdmission = formEncounters("F17-Surgery Admission", encounters)
      .at(-1)
      ?.encounterDatetime.replace("+0000", "");
    return [
      {
        dataElement: "zt3Ocipob8I",
        value: lastAdmission,
      },
    ];
  }
}

function f22(encounter) {
  const answers = filterObsByConcept(
    encounter,
    "38d5dcf5-b8bf-420e-bb14-a270e1f518b3"
  ).map((o) => o.value.display);

  if (answers.length === 0) {
    return;
  }
  const mapping = [
    {
      dataElement: "y5EEruMtgG1",
      value: answers.some((a) => a.includes("None")),
    },
    {
      dataElement: "SqCZBLTRSt7",
      value: answers.some((a) => a.includes("Ventilation")),
    },
    {
      dataElement: "hW2US5pqO9c",
      value: answers.some((a) => a.includes("Cardiac massage")),
    },
    {
      dataElement: "ZgzXA4TjsDg",
      value: answers.some((a) => a.includes("Adrenaline")),
    },
    {
      dataElement: "hW2US5pqO9c",
      value: answers.some((a) => a.includes("Other")),
    },
  ];
  console.log("f22 mapping", mapping);
  return mapping;
}

function f29(encounter, optsMap) {
  const CONCEPTS = {
    OTHER_SPECIFY: "e08d532b-e56c-43dc-b831-af705654d2dc",
    PRECIPITATING_EVENT_OTHER: "790b41ce-e1e7-11e8-b02f-0242ac130002", // Todo: no used anywhere
  };
  const mappings = [];
  if (encounter.form.description.includes("F29-MHPSS Baseline v2")) {
    mappings.push({
      dataElement: "pN4iQH4AEzk",
      value: findAnswerByConcept(
        encounter,
        "22809b19-54ca-4d88-8d26-9577637c184e"
      )
        ? true
        : false,
    });

    const priority1 = findObsByConcept(
      encounter,
      "45b39cbf-0fb2-4682-8544-8aaf3e07a744"
    );
    if (priority1 && priority1?.value?.display === "Other") {
      mappings.push({
        dataElement: "pj5hIE6iyAR",
        value: findObsByConcept(encounter, CONCEPTS.OTHER_SPECIFY)?.value,
      });
    }

    const priority2 = findObsByConcept(
      encounter,
      "ee1b7973-e931-494e-a9cb-22b814b4d8ed"
    );
    if (priority2 && priority2?.value?.display === "Other") {
      mappings.push({
        dataElement: "Em5zvpdd5ha",
        value: findObsByConcept(encounter, CONCEPTS.OTHER_SPECIFY)?.value,
      });
    }

    const priority3 = findObsByConcept(
      encounter,
      "92a92f62-3ff6-4944-9ea9-a7af23949bad"
    );
    if (priority3 && priority3?.value?.display === "Other") {
      mappings.push({
        dataElement: "aWsxYkJR8Ua",
        value: findObsByConcept(encounter, CONCEPTS.OTHER_SPECIFY)?.value,
      });
    }

    const precipitatingEvent1 = findObsByConcept(
      encounter,
      "d5e3d927-f7ce-4fdd-ac4e-6ad0b510b608"
    );
    const otherValue = encounter.obs.find((o) =>
      o.display.includes("Past / Precipitating Events - Other")
    );

    if (
      precipitatingEvent1 &&
      precipitatingEvent1?.value?.uuid === otherValue?.value?.uuid
    ) {
      const opt = optsMap.find(
        (o) => o["value.uuid - External ID"] === otherValue?.value?.uuid
      );

      mappings.push({
        dataElement: "m8qis4iUOTo",
        value: opt?.["DHIS2 Option Code"],
      });
    }

    const precipitatingEvent2 = findObsByConcept(
      encounter,
      "54a9b20e-bce5-4d4a-8c9c-e0248a182586"
    );

    if (
      precipitatingEvent2 &&
      precipitatingEvent2?.value?.uuid === otherValue?.value?.uuid
    ) {
      const opt = optsMap.find(
        (o) => o["value.uuid - External ID"] === otherValue?.value?.uuid
      );
      mappings.push({
        dataElement: "mNK6CITsdWD",
        value: opt?.["DHIS2 Option Code"],
      });
    }

    const precipitatingEvent3 = findObsByConcept(
      encounter,
      "e0d4e006-85b5-41cb-8a21-e013b1978b8b"
    );

    if (
      precipitatingEvent3 &&
      precipitatingEvent3?.value?.uuid === otherValue?.uuid
    ) {
      const opt = optsMap.find(
        (o) => o["value.uuid - External ID"] === otherValue?.value?.uuid
      );
      mappings.push({
        dataElement: "jocqmYW394G",
        value: opt?.["DHIS2 Option Code"],
      });
    }
  }
  return mappings;
}

function f30f29(encounter, allEncounters) {
  if (encounter.form.description.includes("F30-MHPSS Follow-up v2")) {
    const missedSession = (encounter) => {
      if (
        encounter.obs.find(
          (o) => o.concept.uuid === "54e8c1b6-6397-4822-89a4-cf81fbc68ce9"
        )?.value?.display === "No"
      ) {
        return encounter.encounterDatetime.replace("+0000", "");
      }
      const lastFollowupEncounter = allEncounters.find(
        (e) =>
          e.form.description.includes("F30-MHPSS Follow-up v2") &&
          e.patient.uuid === encounter.patient.uuid &&
          e.uuid !== encounter.uuid &&
          e.obs.find(
            (o) => o.concept.uuid === "54e8c1b6-6397-4822-89a4-cf81fbc68ce9"
          )?.value?.display === "No"
      );

      if (lastFollowupEncounter) {
        return lastFollowupEncounter.encounterDatetime.replace("+0000", "");
      }

      const f29Encounter = allEncounters.find(
        (e) =>
          e.form.description.includes("F29-MHPSS Baseline v2") &&
          e.patient.uuid === encounter.patient.uuid
      );
      if (f29Encounter) {
        return f29Encounter.encounterDatetime.replace("+0000", "");
      }
      return undefined;
    };
    const mapping = [
      {
        dataElement: "jtKIoKducvE",
        value: missedSession(encounter),
      },
    ];
    return mapping;
  }
}

function f32f31(encounter, allEncounters) {
  if (encounter.form.description.includes("F32-mhGAP Follow-up v2")) {
    const missedSession = (encounter) => {
      if (
        encounter.obs.find(
          (o) => o.concept.uuid === "54e8c1b6-6397-4822-89a4-cf81fbc68ce9"
        )?.value?.display === "No"
      ) {
        return encounter.encounterDatetime.replace("+0000", "");
      }
      const lastFollowupEncounter = allEncounters.find(
        (e) =>
          e.form.description.includes("F32-mhGAP Follow-up v2") &&
          e.patient.uuid === encounter.patient.uuid &&
          e.uuid !== encounter.uuid &&
          e.obs.find(
            (o) => o.concept.uuid === "54e8c1b6-6397-4822-89a4-cf81fbc68ce9"
          )?.value?.display === "No"
      );

      if (lastFollowupEncounter) {
        return lastFollowupEncounter.encounterDatetime.replace("+0000", "");
      }

      const f31Encounter = allEncounters.find(
        (e) =>
          e.form.description.includes("F31-mhGAP Baseline v2") &&
          e.patient.uuid === encounter.patient.uuid
      );

      if (f31Encounter) {
        return f31Encounter.encounterDatetime.replace("+0000", "");
      }
    };
    const changeInDiagnosis = (encounter) => {
      const patientUuid = encounter.patient.uuid;
      const previousChangeInDiagnosis = allEncounters
        .find(
          (e) =>
            e.patient.uuid === patientUuid &&
            e.form.description.includes("F32-mhGAP Follow-up v2") &&
            encounter.uuid !== e.uuid
        )
        ?.obs.find(
          (o) => o.concept.uuid === "22809b19-54ca-4d88-8d26-9577637c184e"
        )?.value?.display;

      const currentChangeInDiagnosis = encounter.obs.find(
        (o) => o.concept.uuid === "22809b19-54ca-4d88-8d26-9577637c184e"
      )?.value?.display;

      if (
        previousChangeInDiagnosis &&
        previousChangeInDiagnosis !== currentChangeInDiagnosis
      ) {
        return true;
      }

      return false;
    };
    const mapping = [
      {
        dataElement: "fMqEZpiRVZV",
        value: missedSession(encounter),
      },
      {
        dataElement: "XBVRRpgkEvE",
        value: changeInDiagnosis(encounter),
      },
    ];
    return mapping;
  }
}

function f33f34(encounter, allEncounters) {
  if (
    encounter.form.description.includes("F33-MHPSS Closure v2") ||
    encounter.form.description.includes("F34-mhGAP Closure v2")
  ) {
    const lastScore = encounter.obs.find(
      (o) => o.concept.uuid === "90b3d09c-d296-44d2-8292-8e04377fe027"
    )?.value;

    const filterOutScore = allEncounters.filter((e) => {
      const obs = e.obs.find(
        (o) => o.concept.display === "Mental Health Outcome Scale"
      );
      return e.uuid !== encounter.uuid && obs && obs?.value !== 0;
    });

    const firstScore = filterOutScore
      .sort((a, b) => {
        return new Date(a.encounterDatetime) - new Date(b.encounterDatetime);
      })
      .at(0)
      ?.obs.find(
        (o) => o.concept.display === "Mental Health Outcome Scale"
      )?.value;

    return {
      dataElement: "b8bjS7ah8Qi",
      value: lastScore - firstScore,
    };
  }
}

const findDataValue = (encounter, dataElement, metadataMap) => {
  const { optsMap, optionSetKey, form } = metadataMap;
  const [conceptUuid, questionId] =
    form.dataValueMap[dataElement]?.split("-rfe-");
  const answer = encounter.obs.find((o) => o.concept.uuid === conceptUuid);
  const isObjectAnswer = answer && typeof answer.value === "object";
  const isStringAnswer = answer && typeof answer.value === "string";
  const isNumberAnswer = answer && typeof answer.value === "number";

  if (isStringAnswer || isNumberAnswer) {
    return answer.value;
  }

  if (
    isObjectAnswer &&
    conceptUuid === "722dd83a-c1cf-48ad-ac99-45ac131ccc96" &&
    dataElement === "pN4iQH4AEzk"
  ) {
    console.log("Yes done by psychologist..");
    return "" + answer.value.uuid === "278401ee-3d6f-4c65-9455-f1c16d0a7a98";
  }

  if (
    isObjectAnswer &&
    conceptUuid === "54e8c1b6-6397-4822-89a4-cf81fbc68ce9" &&
    dataElement === "G0hLyxqgcO7"
  ) {
    console.log("True only question detected..", dataElement);
    return answer.value.uuid === "681cf0bc-5213-492a-8470-0a0b3cc324dd"
      ? "true"
      : undefined;
  }

  if (isObjectAnswer) {
    const optionKey = questionId
      ? `${encounter.form.uuid}-${answer.concept.uuid}-rfe-${questionId}`
      : `${encounter.form.uuid}-${answer.concept.uuid}`;

    const matchingOptionSet = optionSetKey[optionKey];
    console.log("matchingOptionSet:", matchingOptionSet);
    console.log("Answer:", answer.value.uuid);

    const opt = optsMap.find(
      (o) =>
        o["value.uuid - External ID"] === answer.value.uuid &&
        o["DHIS2 Option Set UID"] === matchingOptionSet
    );

    console.log("Opt:", opt);
    const matchingOption =
      opt?.["DHIS2 Option Code"] ||
      opt?.["DHIS2 Option name"] || // TODO: Sync with AK: We have added this because  Opticon Code is empty in some cases.
      answer?.value?.display; //TODO: revisit this logic if optionSet not found

    if (["FALSE", "No"].includes(matchingOption)) return "false";
    if (["TRUE", "Yes"].includes(matchingOption)) return "true";

    return matchingOption;
  }

  const isEncounterDate =
    conceptUuid === "encounter-date" &&
    ["CXS4qAJH2qD", "I7phgLmRWQq", "yUT7HyjWurN", "EOFi7nk2vNM"].includes(
      dataElement
    );

  // These are data elements for encounter date in DHIS2
  // F29 MHPSS Baseline v2, F31-mhGAP Baseline v2, F30-MHPSS Follow-up v2, F32-mhGAp Follow-up v2
  if (isEncounterDate) {
    return encounter.encounterDatetime.replace("+0000", "");
  }

  return "";
};

const formEncounters = (formDescription, encounters) => {
  return encounters.filter((e) => e.form.description.includes(formDescription));
};

// Prepare DHIS2 data model for create events
fn((state) => {
  const handleMissingRecord = (data, state) => {
    const { uuid, display } = data.patient;

    console.log(uuid, "Patient is missing trackedEntity or enrollment");

    state.missingRecords ??= {};
    state.missingRecords[uuid] ??= {
      encounters: [],
      patient: display,
    };

    state.missingRecords[uuid].encounters.push(data.uuid);
  };

  state.eventsMapping = state.encounters
    .map((encounter) => {
      const form = state.formMaps[encounter.form.uuid];
      if (!form?.dataValueMap) {
        return null;
      }
      const { trackedEntity, enrollment, events } =
        state.childTeis[encounter.patient.uuid] || {};

      if (!trackedEntity || !enrollment) {
        handleMissingRecord(encounter, state);
        return null;
      }
      let formDataValues = Object.keys(form.dataValueMap)
        .map((dataElement) => {
          const value = findDataValue(encounter, dataElement, {
            optsMap: state.optsMap,
            optionSetKey: state.optionSetKey,
            form,
          });

          return { dataElement, value };
        })
        .filter(
          ({ dataElement, value }) =>
            value &&
            !["pj5hIE6iyAR", "KjgDauY9v4J", "DYTLOoEKRas"].includes(dataElement)
        );
      const f16Mapping = f16(encounter);
      const f17Mapping = f17(encounter);
      const f18Mapping = f18(encounter, state.encounters);
      const f13Mapping = f13(encounter, state.optsMap);
      const f11Mapping = f11(encounter, state.optsMap);
      const f22Mapping = f22(encounter);
      const f29Mapping = f29(encounter, state.optsMap);
      const f30f29Mapping = f30f29(encounter, state.allEncounters);
      const f32f31Mapping = f32f31(encounter, state.allEncounters);
      const f33f34Mapping = f33f34(encounter, state.allEncounters);

      const customMapping = [
        f11Mapping,
        f13Mapping,
        f18Mapping,
        f16Mapping,
        f17Mapping,
        f29Mapping,
        f22Mapping,
        f30f29Mapping,
        f32f31Mapping,
        f33f34Mapping,
      ]
        .filter(Boolean) // Only include non-empty mappings
        .flat(); // flattening the array

      return {
        event: events?.find((e) => e.programStage === form.programStage)?.event,
        program: state.formMaps[encounter.form.uuid]?.programId,
        orgUnit: state.formMaps[encounter.form.uuid]?.orgUnit,
        trackedEntity,
        enrollment,
        occurredAt: encounter.encounterDatetime.replace("+0000", ""),
        programStage: form.programStage,
        dataValues: [...formDataValues, ...customMapping],
      };
    })
    .filter(Boolean);

  return state;
});
