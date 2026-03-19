const extractAnswerValue = (answer) => {
  if (!answer) return undefined;
  if (typeof answer.value === "string") return answer.value;
  if (typeof answer.value === "object") return answer.value.display;
};

const findAnswerByConcept = (encounter, conceptUuid, questionId) => {
  if (questionId) {
    const answer = encounter.obs.find(
      (o) => o.concept.uuid === conceptUuid && o.formFieldPath === questionId
    );

    const value = extractAnswerValue(answer);
    return value;
  }
  const answer = encounter.obs.find((o) => o.concept.uuid === conceptUuid);
  return extractAnswerValue(answer);
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

const conceptAndValue = (encounter, conceptUuid, valueUuid) => {
  const answer = encounter.obs.find(
    (o) => o.concept.uuid === conceptUuid && o.value.uuid === valueUuid
  );
  return answer ? "TRUE" : "FALSE";
};
const conceptNotValue = (encounter, conceptUuid, valueUuid) => {
  const answer = encounter.obs.find(
    (o) => o.concept.uuid === conceptUuid && o.value.uuid !== valueUuid
  );
  return answer ? "TRUE" : "FALSE";
};

const conceptTrueOnly = (encounter, conceptUuid) => {
  const answer = encounter.obs.find(
    (o) =>
      o.concept.uuid === conceptUuid &&
      ["yes", "true"].includes(o?.value?.display?.toLowerCase())
  );
  return answer ? "TRUE" : undefined;
};

const conceptAndValueTrueOnly = (encounter, conceptUuid, valueUuid) => {
  const answer = encounter.obs.find(
    (o) => o.concept.uuid === conceptUuid && o.value.uuid === valueUuid
  );
  return answer ? "TRUE" : undefined;
};

const multiSelectAns = (encounter, multiSelectQns) => {
  const dataValues = multiSelectQns
    .map((q) =>
      q.qns
        .map((qn) => {
          const dataElement = qn.clde;
          const ans = encounter.obs.find(
            (obs) =>
              obs.value.uuid === qn.multiAns &&
              obs.formFieldPath === q.qid &&
              obs.concept.uuid === q.extId
          );
          let value = undefined;
          if (qn.type === "TRUE_ONLY") {
            value = ans ? "true" : undefined;
          }
          if (qn.type === "BOOLEAN") {
            value = ans ? "true" : "false";
          }
          return { dataElement, value };
        })
        .filter(Boolean)
    )
    .flat()
    .filter(Boolean);

  return dataValues;
};
const toTrueOrFalse = (value) => {
  if (["true", "yes"].includes(value.toLowerCase())) {
    return "true";
  }
  if (["false", "no"].includes(value.toLowerCase())) {
    return "false";
  }
  return value;
};

const dataValueByConcept = (encounter, de, state) => {
  const { dataElement, conceptUuid, questionId, type } = de || {};

  const answer = encounter.obs.find((o) => o.concept.uuid === conceptUuid);
  const isObjectAnswer = answer && typeof answer.value === "object";
  const isStringAnswer = answer && typeof answer.value === "string";
  const isNumberAnswer = answer && typeof answer.value === "number";

  if (isStringAnswer && type === "time") {
    return answer.value.substring(11, 16);
  }

  if (isStringAnswer || isNumberAnswer) {
    return answer.value;
  }

  if (isObjectAnswer) {
    if (type === "boolean") {
      return toTrueOrFalse(answer.value.display);
    }
    const optionKey = questionId
      ? `${encounter.form.uuid}-${answer.concept.uuid}-${questionId}`
      : `${encounter.form.uuid}-${answer.concept.uuid}`;

    const matchingOptionSet = state.optionSetKey[optionKey];

    const opt = state.optsMap.find(
      (o) =>
        o["value.uuid - External ID"] === answer.value.uuid &&
        o["DHIS2 Option Set UID"] === matchingOptionSet
    );

    if (!opt && matchingOptionSet) {
      console.log(
        `No opt found for External id ${answer.value.uuid} and DHIS2 OptionSet ${matchingOptionSet}`
      );
    }

    const matchingOption = opt?.["DHIS2 Option Code"];

    if (!matchingOption) {
      const optSet = {
        timestamp: new Date().toISOString(),
        openMrsQuestion: answer.concept.display || "N/A",
        conceptExternalId: answer.concept.uuid,
        answerDisplay: answer.value.display,
        answerValueUuid: answer.value.uuid,
        dhis2DataElementUid: dataElement,
        dhis2OptionSetUid: matchingOptionSet || "N/A",
        metadataFormName: encounter.form.name || encounter.form.uuid,
        encounterUuid: encounter.uuid,
        patientUuid: encounter.patient.uuid,
        sourceFile: state.sourceFile,
        optionKey,
      };
      // Capture missing DHIS2 Option Codes for tracking
      state.missingOptsets.push(optSet);
    }

    if (["FALSE", "No"].includes(matchingOption)) return "false";
    if (["TRUE", "Yes"].includes(matchingOption)) return "true";

    return matchingOption;
  }
};

const findDataValue = (encounter, dataElement, state) => {
  const form = state.formMaps[encounter.form.uuid];
  const [conceptUuid, type, questionId] =
    form.dataValueMap[dataElement]?.split("::") || [];
  const answer = encounter.obs.find((o) => o.concept.uuid === conceptUuid);
  const isObjectAnswer = answer && typeof answer.value === "object";
  const isStringAnswer = answer && typeof answer.value === "string";
  const isNumberAnswer = answer && typeof answer.value === "number";

  if (isStringAnswer && type === "time") {
    return answer.value.substring(11, 16);
  }
  if (isStringAnswer || isNumberAnswer) {
    return answer.value;
  }

  if (isObjectAnswer) {
    if (type === "boolean") {
      return toTrueOrFalse(answer.value.display);
    }
    const optionKey = questionId
      ? `${encounter.form.uuid}-${answer.concept.uuid}-${questionId}`
      : `${encounter.form.uuid}-${answer.concept.uuid}`;

    const matchingOptionSet = state.optionSetKey[optionKey];

    const opt = state.optsMap.find(
      (o) =>
        o["value.uuid - External ID"] === answer.value.uuid &&
        o["DHIS2 Option Set UID"] === matchingOptionSet
    );

    // Removed fallback logic to DHIS2 Option name and answer.value.display
    // Now only using DHIS2 Option Code to ensure proper validation
    const matchingOption = opt?.["DHIS2 Option Code"];

    // Capture missing DHIS2 Option Codes for tracking
    if (!matchingOption) {
      state.missingOptsets.push({
        timestamp: new Date().toISOString(),
        openMrsQuestion: answer.concept.display || "N/A",
        conceptExternalId: answer.concept.uuid,
        answerDisplay: answer.value.display,
        answerValueUuid: answer.value.uuid,
        dhis2DataElementUid: dataElement,
        dhis2OptionSetUid: matchingOptionSet || "N/A",
        metadataFormName: encounter.form.name || encounter.form.uuid,
        encounterUuid: encounter.uuid,
        patientUuid: encounter.patient.uuid,
        sourceFile: state.sourceFile,
        optionKey,
      });
    }

    if (["FALSE", "No"].includes(matchingOption)) return "false";
    if (["TRUE", "Yes"].includes(matchingOption)) return "true";

    return matchingOption;
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

  const isEncounterDate =
    conceptUuid === "encounter-date" &&
    ["CXS4qAJH2qD", "I7phgLmRWQq", "yUT7HyjWurN", "EOFi7nk2vNM"].includes(
      dataElement
    );

  // These are data elements for encounter date in DHIS2
  // F29 MHPSS Baseline, F31-mhGAP Baseline, F30-MHPSS Follow-up, F32-mhGAp Follow-up
  if (isEncounterDate) {
    return encounter.encounterDatetime.replace("+0000", "");
  }

  return "";
};

const formEncounters = (formDescription, encounters) => {
  return encounters.filter((e) => e.form.description.includes(formDescription));
};

const buildExitEvent = (encounter, tei, state) => {
  const { program, orgUnit, trackedEntity, enrollment, events } = tei;

  let exitEvents = [];
  const sharedEventMap = {
    program,
    orgUnit,
    trackedEntity,
    enrollment,
    occurredAt: encounter.encounterDatetime.replace("+0000", ""),
  };

  if (encounter.form.name.includes("F49-NCDs Baseline")) {
    const eventsMap = mapF49(encounter, events, state);
    for (const event of eventsMap) {
      exitEvents.push({ ...sharedEventMap, ...event });
    }
  }
  if (encounter.form.name.includes("F50-NCDs Follow-up")) {
    const eventsMap = mapF50(encounter, events, state);
    for (const event of eventsMap) {
      exitEvents.push({ ...sharedEventMap, ...event });
    }
  }
  if (encounter.form.name.includes("F55-HBV Baseline")) {
    const eventsMap = mapF55(encounter, events, state);
    for (const event of eventsMap) {
      exitEvents.push({ ...sharedEventMap, ...event });
    }
  }
  if (encounter.form.name.includes("F56-HBV Follow-up")) {
    const eventsMap = mapF56(encounter, events, state);
    for (const event of eventsMap) {
      exitEvents.push({ ...sharedEventMap, ...event });
    }
  }
  if (encounter.form.name.includes("F58-HCV Follow-up")) {
    const eventsMap = mapF58(encounter, events, state);
    for (const event of eventsMap) {
      exitEvents.push({ ...sharedEventMap, ...event });
    }
  }
  if (encounter.form.name.includes("F59-Social Work Baseline")) {
    const eventsMap = mapF59(encounter, events, state);
    for (const event of eventsMap) {
      exitEvents.push({ ...sharedEventMap, ...event });
    }
  }
  if (encounter.form.name.includes("F60-Social Work Follow-up")) {
    const eventsMap = mapF60(encounter, events, state);
    for (const event of eventsMap) {
      exitEvents.push({ ...sharedEventMap, ...event });
    }
  }

  if (encounter.form.name.includes("F62-Palliative care Baseline")) {
    const eventsMap = mapF62(encounter, events);
    for (const event of eventsMap) {
      exitEvents.push({ ...sharedEventMap, ...event });
    }
  }
  if (encounter.form.name.includes("F63-Palliative care Follow-up")) {
    const eventsMap = mapF63(encounter, events, state);
    for (const event of eventsMap) {
      exitEvents.push({ ...sharedEventMap, ...event });
    }
  }

  return exitEvents;
};

function mapF13(encounter, optsMap) {
  if (encounter.form.name.includes("F13-PNC")) {
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

function mapF16(encounter) {
  const answers = encounter.obs.filter(
    (o) => o.concept.uuid === "877aa979-c02f-4890-8156-836d52696f09"
  );

  if (encounter.form.name.includes("F16-Operative Report") && answers) {
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

function mapF17(encounter) {
  const mappings = [];
  if (
    encounter.form.name.includes("F17-Surgery Admission") &&
    findObsByConcept(encounter, "13d4d6b8-0cd3-46c5-be7b-c3a7565aaca7")
  ) {
    mappings.push({
      dataElement: "hMqZO0MIIT1",
      value: "hours",
    });
  }
  if (
    encounter.form.name.includes("F17-Surgery Admission") &&
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

function mapF18(encounter, encounters) {
  const isDischarge = findObsByConcept(
    encounter,
    "13cea1c8-e426-411f-95b4-33651fc4325d"
  );

  if (encounter.form.name.includes("F18-Surgery Discharge") && isDischarge) {
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

function mapF22(encounter) {
  if (encounter.form.name.includes("F22-Neonatal Delivery")) {
    return [
      {
        dataElement: "BCW1HFeUa4C",
        value: encounter.encounterDatetime.split("T")[0],
      },
    ];
  }
}

function mapF29(encounter) {
  const CONCEPTS = {
    OTHER_SPECIFY: "e08d532b-e56c-43dc-b831-af705654d2dc",
    OTHER: "790b41ce-e1e7-11e8-b02f-0242ac130002",
  };
  const mappings = [];
  if (encounter.form.name.includes("F29-MHPSS Baseline")) {
    mappings.push({
      dataElement: "CXS4qAJH2qD",
      value: encounter.encounterDatetime.split("T")[0],
    });
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
    if (priority1 && priority1?.value?.uuid === CONCEPTS.OTHER) {
      mappings.push({
        dataElement: "pj5hIE6iyAR",
        value: findObsByConcept(encounter, CONCEPTS.OTHER_SPECIFY)?.value,
      });
    }

    const priority2 = findObsByConcept(
      encounter,
      "ee1b7973-e931-494e-a9cb-22b814b4d8ed"
    );
    if (priority2 && priority2?.value?.uuid === CONCEPTS.OTHER) {
      mappings.push({
        dataElement: "Em5zvpdd5ha",
        value: findObsByConcept(encounter, CONCEPTS.OTHER_SPECIFY)?.value,
      });
    }

    const priority3 = findObsByConcept(
      encounter,
      "92a92f62-3ff6-4944-9ea9-a7af23949bad"
    );
    if (priority3 && priority3?.value?.uuid === CONCEPTS.OTHER) {
      mappings.push({
        dataElement: "aWsxYkJR8Ua",
        value: findObsByConcept(encounter, CONCEPTS.OTHER_SPECIFY)?.value,
      });
    }

    const precipitatingEvent1 = findObsByConcept(
      encounter,
      "d5e3d927-f7ce-4fdd-ac4e-6ad0b510b608"
    );
    if (precipitatingEvent1?.value?.uuid === CONCEPTS.OTHER) {
      mappings.push({
        dataElement: "m8qis4iUOTo",
        value: findObsByConcept(encounter, CONCEPTS.OTHER)?.value,
      });
    }

    const precipitatingEvent2 = findObsByConcept(
      encounter,
      "54a9b20e-bce5-4d4a-8c9c-e0248a182586"
    );

    if (precipitatingEvent2?.value?.uuid === CONCEPTS.OTHER) {
      mappings.push({
        dataElement: "mNK6CITsdWD",
        value: findObsByConcept(encounter, CONCEPTS.OTHER)?.value,
      });
    }

    const precipitatingEvent3 = findObsByConcept(
      encounter,
      "e0d4e006-85b5-41cb-8a21-e013b1978b8b"
    );

    if (precipitatingEvent3?.value?.uuid === CONCEPTS.OTHER) {
      mappings.push({
        dataElement: "jocqmYW394G",
        value: findObsByConcept(encounter, CONCEPTS.OTHER)?.value,
      });
    }
  }
  return mappings;
}

function mapF30F29(encounter, allEncounters) {
  if (encounter.form.name.includes("F30-MHPSS Follow-up")) {
    const OTHER = "790b41ce-e1e7-11e8-b02f-0242ac130002";
    const MISSED_SESSION_CONCEPT = "54e8c1b6-6397-4822-89a4-cf81fbc68ce9";
    const YES_UUID = "681cf0bc-5213-492a-8470-0a0b3cc324dd";

    const didNotMissSession = (e) => {
      const obs = e.obs.find((o) => o.concept.uuid === MISSED_SESSION_CONCEPT);
      return obs && obs.value?.uuid !== YES_UUID;
    };

    const missedSession = (encounter) => {
      if (didNotMissSession(encounter)) {
        return encounter.encounterDatetime.replace("+0000", "");
      }

      const lastFollowupEncounter = allEncounters
        .filter(
          (e) =>
            e.form.description.includes("F30-MHPSS Follow-up") &&
            e.patient.uuid === encounter.patient.uuid &&
            e.uuid !== encounter.uuid &&
            didNotMissSession(e)
        )
        .sort(
          (a, b) =>
            new Date(b.encounterDatetime) - new Date(a.encounterDatetime)
        )
        .at(0);

      if (lastFollowupEncounter) {
        return lastFollowupEncounter.encounterDatetime.replace("+0000", "");
      }

      const f29Encounter = allEncounters.find(
        (e) =>
          e.form.description.includes("F29-MHPSS Baseline") &&
          e.patient.uuid === encounter.patient.uuid
      );
      return f29Encounter?.encounterDatetime.replace("+0000", "");
    };
    const precipitatingEvent1 = findObsByConcept(
      encounter,
      "d5e3d927-f7ce-4fdd-ac4e-6ad0b510b608"
    );
    const precipitatingEvent2 = findObsByConcept(
      encounter,
      "54a9b20e-bce5-4d4a-8c9c-e0248a182586"
    );
    const precipitatingEvent3 = findObsByConcept(
      encounter,
      "e0d4e006-85b5-41cb-8a21-e013b1978b8b"
    );

    const mapping = [
      {
        dataElement: "yUT7HyjWurN",
        value: encounter.encounterDatetime.split("T")[0],
      },
      {
        dataElement: "jtKIoKducvE",
        value: missedSession(encounter),
      },
    ];

    if (precipitatingEvent1?.value?.uuid === OTHER) {
      mapping.push({
        dataElement: "XjPbncUyYOH",
        value: findObsByConcept(encounter, OTHER)?.value,
      });
    }
    if (precipitatingEvent2?.value?.uuid === OTHER) {
      mapping.push({
        dataElement: "XPdWXVDiOyv",
        value: findObsByConcept(encounter, OTHER)?.value,
      });
    }
    if (precipitatingEvent3?.value?.uuid === OTHER) {
      mapping.push({
        dataElement: "o4tgbZ1a6iq",
        value: findObsByConcept(encounter, OTHER)?.value,
      });
    }

    return mapping;
  }
}

function mapF32F31(encounter, allEncounters) {
  let mapping = [];
  if (encounter.form.name.includes("F31-mhGAP Baseline")) {
    mapping.push({
      dataElement: "I7phgLmRWQq",
      value: encounter.encounterDatetime.split("T")[0],
    });
  }
  if (encounter.form.name.includes("F32-mhGAP Follow-up")) {
    mapping.push({
      dataElement: "EOFi7nk2vNM",
      value: encounter.encounterDatetime.split("T")[0],
    });
    const missedSession = (encounter) => {
      const YES_UUID = "681cf0bc-5213-492a-8470-0a0b3cc324dd";
      const missedSessionObs = encounter.obs.find(
        (o) => o.concept.uuid === "54e8c1b6-6397-4822-89a4-cf81fbc68ce9"
      );
      if (missedSessionObs?.value?.uuid !== YES_UUID) {
        return encounter.encounterDatetime.replace("+0000", "");
      }
      const lastFollowupEncounter = allEncounters
        .filter(
          (e) =>
            e.form.description.includes("F32-mhGAP Follow-up") &&
            e.patient.uuid === encounter.patient.uuid &&
            e.uuid !== encounter.uuid &&
            e.obs.find(
              (o) => o.concept.uuid === "54e8c1b6-6397-4822-89a4-cf81fbc68ce9"
            )?.value?.uuid !== YES_UUID
        )
        .sort(
          (a, b) =>
            new Date(b.encounterDatetime) - new Date(a.encounterDatetime)
        )[0];

      if (lastFollowupEncounter) {
        return lastFollowupEncounter.encounterDatetime.replace("+0000", "");
      }

      const f31Encounter = allEncounters.find(
        (e) =>
          e.form.description.includes("F31-mhGAP Baseline") &&
          e.patient.uuid === encounter.patient.uuid
      );

      if (f31Encounter) {
        return f31Encounter.encounterDatetime.replace("+0000", "");
      }
    };
    const changeInDiagnosis = (encounter) => {
      const DIAGNOSIS_CONCEPT = "22809b19-54ca-4d88-8d26-9577637c184e";

      const currentDiagnosisObs = encounter.obs.find(
        (o) =>
          o.concept.uuid === DIAGNOSIS_CONCEPT &&
          o.formFieldPath === "rfe-forms-changeInDiagnosis"
      );
      if (!currentDiagnosisObs?.value) return false;

      const currentDiagnosisUuid = currentDiagnosisObs.value.uuid;

      const lastConsultation = allEncounters
        .filter(
          (e) =>
            e.patient.uuid === encounter.patient.uuid &&
            e.uuid !== encounter.uuid &&
            (e.form.description.includes("F31-mhGAP Baseline") ||
              e.form.description.includes("F32-mhGAP Follow-up"))
        )
        .sort(
          (a, b) =>
            new Date(b.encounterDatetime) - new Date(a.encounterDatetime)
        )[0];

      if (!lastConsultation) return false;

      const prevFieldPath = lastConsultation.form.description.includes(
        "F31-mhGAP Baseline"
      )
        ? "rfe-forms-mainDiagnosis"
        : "rfe-forms-changeInDiagnosis";

      const previousDiagnosisUuid = lastConsultation.obs.find(
        (o) =>
          o.concept.uuid === DIAGNOSIS_CONCEPT &&
          o.formFieldPath === prevFieldPath
      )?.value?.uuid;

      return (
        !!previousDiagnosisUuid &&
        previousDiagnosisUuid !== currentDiagnosisUuid
      );
    };
    mapping.push(
      {
        dataElement: "fMqEZpiRVZV",
        value: missedSession(encounter),
      },
      {
        dataElement: "XBVRRpgkEvE",
        value: changeInDiagnosis(encounter),
      }
    );
  }
  return mapping;
}

function mapF33F34(encounter, allEncounters) {
  if (
    encounter.form.name.includes("F33-MHPSS Closure") ||
    encounter.form.name.includes("F34-mhGAP Closure")
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

function mapF37(encounter) {
  if (encounter.form.name.includes("F37-Maternity Admission")) {
    return [
      {
        dataElement: "O7HyhSTFrA0",
        value: encounter.encounterDatetime.split("T")[0],
      },
    ];
  }
}

function mapF38(encounter) {
  if (encounter.form.name.includes("F38-Maternity Delivery")) {
    let f38Mapping = [
      {
        dataElement: "MfzUDNqvZdy",
        value: encounter.encounterDatetime.split("T")[0],
      },
    ];

    return f38Mapping;
  }
}
function mapF40(encounter) {
  if (encounter.form.name.includes("F40-Referral & Discharge")) {
    return [
      {
        dataElement: "T4TwDpbKGdZ",
        value: "",
      },
      {
        dataElement: "X1DYPGS8g3g",
        value: "",
      },
    ];
  }
}

const F49_CONFIG = {
  diagnosisAtAdmissionUuid: "22809b19-54ca-4d88-8d26-9577637c184e",

  diagnosisMappings: [
    {
      de: "mjnK3aUJuTa",
      concept: "fad7b56b-7633-4467-9e6a-17328278b580",
      qid: "rfe-forms-hypertension",
      answer: "10f3b49c-c3dc-4aa7-857f-3f9bb7df8dd0",
    },
    {
      de: "onGHyvZ2RmZ",
      concept: "f9bd6164-18e9-41ce-97cd-45ff85d6f124",
      qid: "rfe-forms-diabetesTypeI",
      answer: "ed1150fd-278f-4012-b3d7-a795ac9fac82",
    },
    {
      de: "E9BaT4zG4J4",
      concept: "db973d66-e027-4238-87c9-fa6e53026d12",
      qid: "rfe-forms-diabetesTypeIi",
      answer: "f1ee73b2-08cb-4373-80ac-357a704d3608",
    },
    {
      de: "iFvba0J2evJ",
      concept: "3a5da658-2750-4872-9499-3c9e858f5eb6",
      qid: "rfe-forms-gestationalDiabetes",
      answer: "84fc5a0d-0158-4c41-b6e5-8ac7ebfccc0c",
    },
    {
      de: "J21496i94EP",
      concept: "10ea847e-58c7-4da0-a112-ee1f0883e31b",
      qid: "rfe-forms-hypothyroidism",
      answer: "aecac536-6eea-4de8-a450-a9ad9608514a",
    },
    {
      de: "JznJsvXpTnK",
      concept: "42e81b70-63ab-4387-aebe-90e20db918e7",
      qid: "rfe-forms-chronicRenalDisease",
      answer: "2066f043-2f21-4c19-8c04-77301d7404f9",
    },
    {
      de: "pGT54AYo27j",
      concept: "82a5dadc-77ea-4765-b766-fb1e0336a736",
      qid: "rfe-forms-asthma",
      answer: "c10a05bc-e814-4693-a789-1eb884270381",
    },
    {
      de: "ajFiLhKjK53",
      concept: "68b7e054-046a-4ec1-8c6a-b05d0480da47",
      qid: "rfe-forms-copd",
      answer: "0d9a7323-b54a-4d2b-a231-e34fa54e3a54",
    },
    {
      de: "ymMmDdzmXJB",
      concept: "5078ef27-0826-46c2-ac50-30ebf25cb686",
      qid: "rfe-forms-cardiovascularDisorders",
      answer: "6541ddce-0e3c-4b7d-ad52-2bfe18e24dd5",
    },
    {
      de: "Pl71DwAselm",
      concept: "ada7c7aa-261c-4808-b3ec-1236952ad1da",
      qid: "rfe-forms-cardiovascularOther",
      answer: "ada7c7aa-261c-4808-b3ec-1236952ad1da",
    },
    {
      de: "eQfdTbag11h",
      concept: "fe989a53-9788-46e9-a170-f1f4b7abfddf",
      qid: "rfe-forms-heartFailure",
      answer: "6a7a9d6a-e8b6-4ffb-8321-a56e9e4473e0",
    },
    {
      de: "WpyNugbQKYk",
      concept: "09334f94-5efd-49f0-b494-68b9192f2fd8",
      qid: "rfe-forms-epilepsy",
      answer: "681cf0bc-5213-492a-8470-0a0b3cc324dd",
    },
    {
      de: "n36Fq9tLoWJ",
      concept: "37b7ceb1-2ebd-43c5-9be7-c1c5e29e1dbc",
      qid: "rfe-forms-otherNcd",
      answer: "37b7ceb1-2ebd-43c5-9be7-c1c5e29e1dbc",
    },
    {
      de: "yHYhmy1H46g",
      concept: "d48039ad-1700-406d-b9c2-b3bf355d61f9",
      qid: "rfe-forms-depression",
      answer: "2066f043-2f21-4c19-8c04-77301d7404f9",
    },
    {
      de: "zWqzSMJlxCz",
      concept: "6c0beb80-d7bd-4580-8f36-b6ffee8661fe",
      qid: "rfe-forms-psychosisOrBpad",
      answer: "10336195-ecd9-45bc-b6b4-b08ff1498e1b",
    },
    {
      de: "CqqksYsDFDE",
      concept: "7aff0f40-e039-43fb-971d-0c07ed9fcde1",
      qid: "rfe-forms-stressRelatedDisorder",
      answer: "7aff0f40-e039-43fb-971d-0c07ed9fcde1",
    },
    {
      de: "QkgnTdel3HA",
      concept: "43024c85-60c3-4dd0-acde-33d259ad1e33",
      qid: "rfe-forms-substanceDisorders",
      answer: "fcc01124-3d7b-4e6f-be35-50233a7f64cb",
    },
    {
      de: "uXKjVsrotpW",
      concept: "fef73529-e631-4620-920b-ff7fc5d458da",
      qid: "rfe-forms-childOrAdolescentDisorder",
      answer: "fef73529-e631-4620-920b-ff7fc5d458da",
    },
    {
      de: "EAhwOfxv3Zx",
      concept: "af23b916-3e95-4bd4-8804-a4b1649ff365",
      qid: "rfe-forms-selfHarmOrSuicide",
      answer: "b27187bd-e94a-4dbc-9a77-46c0cefad25a",
    },
    {
      de: "UGcyXNE5aDG",
      concept: "88fc3c44-9ad1-4d33-b4ea-d2223c906f42",
      qid: "rfe-forms-otherMhDisease",
      answer: "88fc3c44-9ad1-4d33-b4ea-d2223c906f42",
    },
  ],

  pregnancyStage: {
    programStage: "RVgciZl54Aj",
    mappings: [
      {
        de: "aFc9FG0PaRf",
        concept: "4cc41121-74da-42ac-ab89-e8878db66020",
        qid: "rfe-forms-estimatedDateOfDelivery",
      },
      {
        de: "J62aIKRxrBQ",
        concept: "bf704b21-d203-4fb8-9b90-a2c29caad61b",
        qid: "rfe-forms-antenatalConsultations",
      },
      {
        de: "b6dGoMJm1jO",
        concept: "422c3a5d-4f67-4cbf-9236-3b7bfdcd8e14",
        qid: "rfe-forms-currentlyOnContraception",
      },
      {
        de: "clnZXAAKStw",
        concept: "6afb5d27-3e86-42ff-bad1-38f90897e0b6",
        qid: "rfe-forms-method",
      },
    ],
  },

  investigationStage: {
    programStage: "zqmLGzSPv3T",
    simpleValues: [
      {
        de: "QJXo4pwCxJR",
        concept: "033ff20d-4cc5-4da0-ad5e-c42ce25df1e1",
        qid: "rfe-forms-hba1c",
      },
      {
        de: "pG7e3WfYoTL",
        concept: "bc6f8c3a-80ad-46f2-ad76-bd4189ea61c7",
        qid: "rfe-forms-creatinine",
      },
      {
        de: "BdSAkE2x4k2",
        concept: "397b7cc1-9687-4796-a2a6-52d04f963e71",
        qid: "rfe-forms-creatinine_1",
      },
      {
        de: "qd60Le4nrd6",
        concept: "910cf2bc-b9fe-4997-845f-409583bbd2fd",
        qid: "rfe-forms-egfr",
      },
      {
        de: "dV5ngpIQymO",
        concept: "ee8dd465-4f0c-4f81-9c9f-8dd1e419a9d8",
        qid: "rfe-forms-creatinineClearance",
      },
    ],
    trueOnly: [
      {
        de: "YAkbJFXtTFU",
        concept: "9265064e-104f-431d-b50d-4cd8b7a39526",
        qid: "rfe-forms-totalCholesterolDone",
      },
      {
        de: "nqINkxxSTe1",
        concept: "b20c05db-cc1e-41f8-abbe-cdd8fcef82cc",
        qid: "rfe-forms-creatinineDone",
      },
      {
        de: "tK9u009wENy",
        concept: "19d395d5-9e2f-4f9b-9723-1fd64e879421",
        qid: "rfe-forms-urineAnalysisDone",
      },
      {
        de: "AosqYtkFCzH",
        concept: "41e0892a-3962-4ee6-8adc-b65322da183b",
        qid: "rfe-forms-altDone",
      },
      {
        de: "Ucg0LjdAiqu",
        concept: "e2826aa6-af7b-49cd-b3a3-5ffae92c202d",
        qid: "rfe-forms-kDone",
      },
      {
        de: "bG9RawjSauF",
        concept: "1b1ddab9-1463-4b79-9d25-b591bca6127e",
        qid: "rfe-forms-tshDone",
      },
      {
        de: "pdzQ3dYXcKh",
        concept: "382d6a15-1e60-43a3-8ee5-bb0f7b11b17b",
        qid: "rfe-forms-inrDone",
      },
      {
        de: "NqrNohB1MRq",
        concept: "1ecf8c4a-c70c-4fa6-b840-2e13cdb217fe",
        qid: "rfe-forms-ldlDone",
      },
    ],
    codedValues: [
      {
        de: "gPplT1Gk1uB",
        concept: "3fe91b1d-3c94-4752-ac36-75d4e6af379c",
        qid: "rfe-forms-extremitiesOrFootExam",
      },
      {
        de: "zmn2V11p3SW",
        concept: "f5b2b5ff-47bb-41e1-bbcc-3d7b2ecb373f",
        qid: "rfe-forms-ecg",
      },
      {
        de: "DWYLDxxZpK5",
        concept: "b754e7bb-d425-4f62-988e-3bccc2abf332",
        qid: "rfe-forms-echoResult",
      },
    ],
  },
};
function mapDiagnosisF49(encounter, mapping, state) {
  const diagnosisObs = encounter.obs.find(
    (o) => o.concept.uuid === mapping.concept && o.formFieldPath === mapping.qid
  );

  if (diagnosisObs?.value) {
    return dataValueByConcept(
      encounter,
      {
        dataElement: mapping.de,
        conceptUuid: mapping.concept,
        questionId: mapping.qid,
      },
      state
    );
  }

  const diagnosisAtAdmission = encounter.obs.find(
    (o) =>
      o.concept.uuid === F49_CONFIG.diagnosisAtAdmissionUuid &&
      o.value?.uuid === mapping.answer
  );

  return diagnosisAtAdmission ? "unknown" : "no";
}

function mapF49(encounter, events, state) {
  const { dhis2Map } = state;
  const form = state.formMaps[encounter.form.uuid];
  const programStage = form?.programStage;
  const syncType = form?.syncType;
  const dataEl = dhis2Map.de;

  const defaultEvent =
    syncType === "latest"
      ? events?.find((e) => e.programStage === programStage)?.event
      : undefined;
  const pregnancyEvent =
    syncType === "latest"
      ? events?.find(
          (e) => e.programStage === F49_CONFIG.pregnancyStage.programStage
        )?.event
      : undefined;
  const investigationEvent =
    syncType === "latest"
      ? events?.find(
          (e) => e.programStage === F49_CONFIG.investigationStage.programStage
        )?.event
      : undefined;

  // DEFAULT STAGE
  const defaultDataValues = [];

  // 1. Consultation date
  const consultationDate = encounter.obs.find(
    (o) => o.concept.uuid === "d329cd4b-a10f-4a4d-96b5-c907bf87e721"
  )?.value;

  if (consultationDate) {
    defaultDataValues.push({
      dataElement: dataEl.ncdEventDate,
      value: consultationDate,
    });
  }

  // 2. Is readmission
  const admissionTypeObs = encounter.obs.find(
    (o) => o.concept.uuid === "4dae5b12-070f-4153-b1ca-fbec906106e1"
  );

  if (admissionTypeObs) {
    const isReadmission =
      admissionTypeObs.value?.display?.toLowerCase() === "re-admission";
    defaultDataValues.push({
      dataElement: "SjNE9mM7Yu4",
      value: `${isReadmission}`,
    });
  }

  // 3. Diagnosis mappings
  F49_CONFIG.diagnosisMappings.forEach((mapping) => {
    const value = mapDiagnosisF49(encounter, mapping, state);
    if (value) {
      defaultDataValues.push({
        dataElement: mapping.de,
        value: value,
      });
    }
  });

  // NCD - if other, please specify
  const ncdOtherSpecify = findAnswerByConcept(
    encounter,
    "790b41ce-e1e7-11e8-b02f-0242ac130002",
    "rfe-forms-ncdIfOtherPleaseSpecify"
  );
  if (ncdOtherSpecify) {
    defaultDataValues.push({
      dataElement: "MJpqEQtsuTe",
      value: ncdOtherSpecify,
    });
  }

  // Blood glucose type (analysis type) - baseline stage
  const bloodGlucoseType = dataValueByConcept(
    encounter,
    {
      dataElement: "SBOOnIpTfHb",
      conceptUuid: "7b446689-cefa-49b9-a30a-7795bce1ff35",
      questionId: "rfe-forms-bloodGlucoseType",
    },
    state
  );
  if (bloodGlucoseType) {
    defaultDataValues.push({
      dataElement: "SBOOnIpTfHb",
      value: bloodGlucoseType,
    });
  }

  // Multi-select TEXT slot-filling helper: distributes selected answers to N DE slots in order
  const fillSlots = (conceptUuid, qid, slots, optionSetUid) => {
    const obsArr = encounter.obs.filter(
      (o) => o.concept.uuid === conceptUuid && o.formFieldPath === qid
    );
    obsArr.forEach((obs, i) => {
      if (i >= slots.length) return;
      const opt = state.optsMap.find(
        (o) =>
          o["value.uuid - External ID"] === obs.value?.uuid &&
          o["DHIS2 Option Set UID"] === optionSetUid
      );
      if (!opt) {
        state.missingOptsets.push({
          timestamp: new Date().toISOString(),
          openMrsQuestion: obs.concept.display || "N/A",
          conceptExternalId: conceptUuid,
          answerDisplay: obs.value?.display,
          answerValueUuid: obs.value?.uuid,
          dhis2DataElementUid: slots[i],
          dhis2OptionSetUid: optionSetUid || "N/A",
          metadataFormName: encounter.form.name || encounter.form.uuid,
          encounterUuid: encounter.uuid,
          patientUuid: encounter.patient.uuid,
          sourceFile: state.sourceFile,
          optionKey: `${encounter.form.uuid}-${conceptUuid}-${qid}`,
        });
      }
      let value = opt?.["DHIS2 Option Code"];
      if (["FALSE", "No"].includes(value)) value = "false";
      else if (["TRUE", "Yes"].includes(value)) value = "true";
      if (value) defaultDataValues.push({ dataElement: slots[i], value });
    });
  };

  // Observed complication (multi-select, up to 4 slots) - optionSet YW1t64pNlUH
  fillSlots(
    "ec9ffc6e-22c9-4489-ab88-c517460e7838",
    "rfe-forms-observedComplication",
    ["Ff5TAZQB2Gx", "jy6y43zcjIF", "nroQVwfad5s", "zzlWrNP7L9F"],
    "YW1t64pNlUH"
  );

  // Medication (multi-select, up to 10 slots) - optionSet z8NoIBE61lI
  fillSlots(
    "ae1e4603-7ab4-4ed1-902e-eee33a9c5eef",
    "rfe-forms-medication",
    [
      "pfOVAvGLYVi",
      "iY9Y8G4uOod",
      "q3QvzsuauGq",
      "ekSky9wr0MO",
      "zgSRhgLfTn4",
      "nimcdwULYjp",
      "NfDhplV9xJA",
      "LBWHFdwKzKO",
      "VIXCChJKawm",
      "wrVSDgmMj4j",
    ],
    "z8NoIBE61lI"
  );

  // Other medication (free text)
  const otherMedication = findAnswerByConcept(
    encounter,
    "f1213704-06fa-4b23-9c8a-94a7236b833d",
    "rfe-forms-otherMedication"
  );
  if (otherMedication) {
    defaultDataValues.push({
      dataElement: "mVmxMXoEfCg",
      value: otherMedication,
    });
  }

  // Referral specialist type (multi-select, up to 3 slots) - optionSet cWcZ5KAXfub
  fillSlots(
    "8fb3bb7d-c935-4b57-8444-1b953470e109",
    "rfe-forms-referralSpecialistType",
    ["Atg3aAfVv2V", "a35jmcOCCwc", "eurWUL2l6Gw"],
    "cWcZ5KAXfub"
  );

  // "If other specialist type specify" slots - fill slot N if the Nth selected referral specialist type is 'Other specialist'
  const referralSpecialistObs = encounter.obs.filter(
    (o) =>
      o.concept.uuid === "8fb3bb7d-c935-4b57-8444-1b953470e109" &&
      o.formFieldPath === "rfe-forms-referralSpecialistType"
  );
  const specialistOtherText = findAnswerByConcept(
    encounter,
    "790b41ce-e1e7-11e8-b02f-0242ac130002",
    "rfe-forms-specialistIfOtherPleaseSpecify"
  );
  if (specialistOtherText) {
    const otherSpecialistSlots = ["iXRsVYYypkU", "xnpdL9cgpDH", "NYEmxR8LW75"];
    referralSpecialistObs.forEach((obs, i) => {
      if (i >= otherSpecialistSlots.length) return;

      defaultDataValues.push({
        dataElement: otherSpecialistSlots[i],
        value: specialistOtherText,
      });
    });
  }

  // PREGNANCY STAGE
  const pregnancyDataValues = [];

  F49_CONFIG.pregnancyStage.mappings.forEach((mapping) => {
    const value = dataValueByConcept(
      encounter,
      {
        dataElement: mapping.de,
        conceptUuid: mapping.concept,
        questionId: mapping.qid,
      },
      state
    );

    if (value !== undefined && value !== null) {
      pregnancyDataValues.push({
        dataElement: mapping.de,
        value,
      });
    }
  });

  // INVESTIGATION RESULTS STAGE
  const investigationDataValues = [];

  // Simple values
  F49_CONFIG.investigationStage.simpleValues.forEach((mapping) => {
    const obs = encounter.obs.find(
      (o) =>
        o.concept.uuid === mapping.concept && o.formFieldPath === mapping.qid
    );

    if (obs?.value !== undefined && obs?.value !== null) {
      investigationDataValues.push({
        dataElement: mapping.de,
        value: obs.value,
      });
    }
  });

  // TRUE_ONLY values
  F49_CONFIG.investigationStage.trueOnly.forEach((mapping) => {
    const value = conceptTrueOnly(encounter, mapping.concept);
    if (value) {
      investigationDataValues.push({
        dataElement: mapping.de,
        value,
      });
    }
  });

  // Coded values
  F49_CONFIG.investigationStage.codedValues.forEach((mapping) => {
    const value = dataValueByConcept(
      encounter,
      {
        dataElement: mapping.de,
        conceptUuid: mapping.concept,
        questionId: mapping.qid,
      },
      state
    );
    if (value) {
      investigationDataValues.push({
        dataElement: mapping.de,
        value,
      });
    }
  });

  return [
    {
      event: defaultEvent,
      programStage,
      dataValues: defaultDataValues,
    },
    ...(pregnancyDataValues.length > 0
      ? [
          {
            event: pregnancyEvent,
            programStage: F49_CONFIG.pregnancyStage.programStage,
            dataValues: pregnancyDataValues,
          },
        ]
      : []),
    ...(investigationDataValues.length > 0
      ? [
          {
            event: investigationEvent,
            programStage: F49_CONFIG.investigationStage.programStage,
            dataValues: investigationDataValues,
          },
        ]
      : []),
  ];
}

// F50 CONFIGURATION
const F50_CONFIG = {
  newDiagnosisUuid: "f63e1804-0062-4a4a-a412-d07dad95e960",
  diagnosisRemainsTheSameUuid: "22809b19-54ca-4d88-8d26-9577637c184e",

  diagnosisMappings: [
    {
      de: "AXoG311ik9e",
      answer: "c10a05bc-e814-4693-a789-1eb884270381",
      qid: "rfe-forms-asthma",
    },
    {
      de: "bpsI6R1AYIb",
      answer: "6541ddce-0e3c-4b7d-ad52-2bfe18e24dd5",
      qid: "rfe-forms-cardiovascularDisorders",
    },
    {
      de: "dFDzcBWC4mP",
      answer: "ada7c7aa-261c-4808-b3ec-1236952ad1da",
      qid: "rfe-forms-cardiovascularOther",
    },
    {
      de: "TG4Z9U0Dviz",
      answer: "fef73529-e631-4620-920b-ff7fc5d458da",
      qid: "rfe-forms-childOrAdolescentDisorder",
    },
    {
      de: "GBBL7viQXvt",
      answer: "84fc5a0d-0158-4c41-b6e5-8ac7ebfccc0c",
      qid: "rfe-forms-chronicRenalDisease",
    },
    {
      de: "HGUVMcvDNl0",
      answer: "0d9a7323-b54a-4d2b-a231-e34fa54e3a54",
      qid: "rfe-forms-copd",
    },
    {
      de: "Ds7biYZkd2d",
      answer: "2066f043-2f21-4c19-8c04-77301d7404f9",
      qid: "rfe-forms-depression",
    },
    {
      de: "G2k65mDPn2e",
      answer: "ed1150fd-278f-4012-b3d7-a795ac9fac82",
      qid: "rfe-forms-diabetesTypeI",
    },
    {
      de: "OGlbbWRjbQI",
      answer: "f1ee73b2-08cb-4373-80ac-357a704d3608",
      qid: "rfe-forms-diabetesTypeIi",
    },
    {
      de: "oAxAngdds50",
      answer: "221d041d-1c52-49aa-a370-d0c763893b8f",
      qid: "rfe-forms-epilepsy",
    },
    {
      de: "Td54s1N65No",
      answer: "2b816c77-3c82-4444-b91a-f0f7b9ddaad5",
      qid: "rfe-forms-gestationalDiabetes",
    },
    {
      de: "oqHxcCMjpTK",
      answer: "6a7a9d6a-e8b6-4ffb-8321-a56e9e4473e0",
      qid: "rfe-forms-heartFailure",
    },
    {
      de: "Bew76ch1i4i",
      answer: "10f3b49c-c3dc-4aa7-857f-3f9bb7df8dd0",
      qid: "rfe-forms-hypertension",
    },
    {
      de: "wyjVWkgUdJG",
      answer: "aecac536-6eea-4de8-a450-a9ad9608514a",
      qid: "rfe-forms-hypothyroidism",
    },
    {
      de: "C7zJtdEdZws",
      answer: "88fc3c44-9ad1-4d33-b4ea-d2223c906f42",
      qid: "rfe-forms-otherMhDisease",
    },
    {
      de: "mlDXttAXrWI",
      answer: "37b7ceb1-2ebd-43c5-9be7-c1c5e29e1dbc",
      qid: "rfe-forms-otherNcd",
    },
    {
      de: "TSSN2CT6OGr",
      answer: "10336195-ecd9-45bc-b6b4-b08ff1498e1b",
      qid: "rfe-forms-psychosisOrBpad",
    },
    {
      de: "TuK457D8sTi",
      answer: "b27187bd-e94a-4dbc-9a77-46c0cefad25a",
      qid: "rfe-forms-selfHarmOrSuicide",
    },
    {
      de: "PRKYg4AApSm",
      answer: "7aff0f40-e039-43fb-971d-0c07ed9fcde1",
      qid: "rfe-forms-stressRelatedDisorder",
    },
    {
      de: "CFFTmUlb5un",
      answer: "fcc01124-3d7b-4e6f-be35-50233a7f64cb",
      qid: "rfe-forms-substanceDisorders",
    },
  ],

  pregnancyStage: {
    programStage: "RVgciZl54Aj",
    mappings: [
      {
        de: "aFc9FG0PaRf",
        concept: "4cc41121-74da-42ac-ab89-e8878db66020",
        qid: "rfe-forms-estimatedDateOfDelivery",
      },
      {
        de: "J62aIKRxrBQ",
        concept: "bf704b21-d203-4fb8-9b90-a2c29caad61b",
        qid: "rfe-forms-antenatalConsultations",
      },
      {
        de: "b6dGoMJm1jO",
        concept: "422c3a5d-4f67-4cbf-9236-3b7bfdcd8e14",
        qid: "rfe-forms-currentlyOnContraception",
      },
      {
        de: "clnZXAAKStw",
        concept: "6afb5d27-3e86-42ff-bad1-38f90897e0b6",
        qid: "rfe-forms-method",
      },
    ],
  },

  investigationStage: {
    programStage: "zqmLGzSPv3T",
    simpleValues: [
      {
        de: "QJXo4pwCxJR",
        concept: "033ff20d-4cc5-4da0-ad5e-c42ce25df1e1",
        qid: "rfe-forms-hba1c_1",
      },
      {
        de: "pG7e3WfYoTL",
        concept: "bc6f8c3a-80ad-46f2-ad76-bd4189ea61c7",
        qid: "rfe-forms-creatinine",
      },
      {
        de: "BdSAkE2x4k2",
        concept: "397b7cc1-9687-4796-a2a6-52d04f963e71",
        qid: "rfe-forms-creatinine_1",
      },
      {
        de: "qd60Le4nrd6",
        concept: "910cf2bc-b9fe-4997-845f-409583bbd2fd",
        qid: "rfe-forms-egfr",
      },
      {
        de: "dV5ngpIQymO",
        concept: "ee8dd465-4f0c-4f81-9c9f-8dd1e419a9d8",
        qid: "rfe-forms-creatinineClearance",
      },
    ],
    trueOnly: [
      {
        de: "YAkbJFXtTFU",
        concept: "9265064e-104f-431d-b50d-4cd8b7a39526",
        qid: "rfe-forms-totalCholesterolDone",
      },
      {
        de: "nqINkxxSTe1",
        concept: "b20c05db-cc1e-41f8-abbe-cdd8fcef82cc",
        qid: "rfe-forms-creatinineDone",
      },
      {
        de: "tK9u009wENy",
        concept: "19d395d5-9e2f-4f9b-9723-1fd64e879421",
        qid: "rfe-forms-urineAnalysisDone",
      },
      {
        de: "AosqYtkFCzH",
        concept: "41e0892a-3962-4ee6-8adc-b65322da183b",
        qid: "rfe-forms-altDone",
      },
      {
        de: "Ucg0LjdAiqu",
        concept: "e2826aa6-af7b-49cd-b3a3-5ffae92c202d",
        qid: "rfe-forms-kDone",
      },
      {
        de: "bG9RawjSauF",
        concept: "1b1ddab9-1463-4b79-9d25-b591bca6127e",
        qid: "rfe-forms-tshDone",
      },
      {
        de: "pdzQ3dYXcKh",
        concept: "382d6a15-1e60-43a3-8ee5-bb0f7b11b17b",
        qid: "rfe-forms-inrDone",
      },
      {
        de: "NqrNohB1MRq",
        concept: "1ecf8c4a-c70c-4fa6-b840-2e13cdb217fe",
        qid: "rfe-forms-ldlDone",
      },
    ],
    codedValues: [
      {
        de: "gPplT1Gk1uB",
        concept: "3fe91b1d-3c94-4752-ac36-75d4e6af379c",
        qid: "rfe-forms-extremitiesOrFootExam",
      },
      {
        de: "zmn2V11p3SW",
        concept: "f5b2b5ff-47bb-41e1-bbcc-3d7b2ecb373f",
        qid: "rfe-forms-ecg",
      },
      {
        de: "DWYLDxxZpK5",
        concept: "b754e7bb-d425-4f62-988e-3bccc2abf332",
        qid: "rfe-forms-echoResult",
      },
    ],
  },
};

function mapDiagnosisF50(encounter, mapping) {
  // Check if this diagnosis was selected in "New diagnosis" question
  const newDiagnosisObs = encounter.obs.find(
    (o) =>
      o.concept.uuid === F50_CONFIG.newDiagnosisUuid &&
      o.value?.uuid === mapping.answer
  );

  if (newDiagnosisObs) {
    return "newly_diagnosed";
  }

  // Check if "Diagnosis remains the same?" was answered with this diagnosis
  const diagnosisRemainsObs = encounter.obs.find(
    (o) =>
      o.concept.uuid === F50_CONFIG.diagnosisRemainsTheSameUuid &&
      o.value?.uuid === mapping.answer
  );

  return diagnosisRemainsObs ? "unknown" : "no";
}

function mapF50(encounter, events, state) {
  const { dhis2Map } = state;
  const form = state.formMaps[encounter.form.uuid];
  const programStage = form?.programStage;
  const syncType = form?.syncType;
  const dataEl = dhis2Map.de;

  const defaultEvent =
    syncType === "latest"
      ? events?.find((e) => e.programStage === programStage)?.event
      : undefined;

  // DEFAULT STAGE
  const defaultDataValues = [];

  // Multi-select TEXT slot-filling helper: distributes selected answers to N DE slots in order
  const fillSlots = (conceptUuid, qid, slots, optionSetUid) => {
    const obsArr = encounter.obs.filter(
      (o) => o.concept.uuid === conceptUuid && o.formFieldPath === qid
    );
    obsArr.forEach((obs, i) => {
      if (i >= slots.length) return;
      const opt = state.optsMap.find(
        (o) =>
          o["value.uuid - External ID"] === obs.value?.uuid &&
          o["DHIS2 Option Set UID"] === optionSetUid
      );
      if (!opt) {
        state.missingOptsets.push({
          timestamp: new Date().toISOString(),
          openMrsQuestion: obs.concept.display || "N/A",
          conceptExternalId: conceptUuid,
          answerDisplay: obs.value?.display,
          answerValueUuid: obs.value?.uuid,
          dhis2DataElementUid: slots[i],
          dhis2OptionSetUid: optionSetUid || "N/A",
          metadataFormName: encounter.form.name || encounter.form.uuid,
          encounterUuid: encounter.uuid,
          patientUuid: encounter.patient.uuid,
          sourceFile: state.sourceFile,
          optionKey: `${encounter.form.uuid}-${conceptUuid}-${qid}`,
        });
      }
      let value = opt?.["DHIS2 Option Code"];
      if (["FALSE", "No"].includes(value)) value = "false";
      else if (["TRUE", "Yes"].includes(value)) value = "true";
      if (value) defaultDataValues.push({ dataElement: slots[i], value });
    });
  };

  // 1. Consultation date
  const consultationDate = encounter.obs.find(
    (o) => o.concept.uuid === "d329cd4b-a10f-4a4d-96b5-c907bf87e721"
  )?.value;

  if (consultationDate) {
    defaultDataValues.push({
      dataElement: dataEl.ncdEventDate,
      value: consultationDate,
    });
  }

  // 2. Diagnosis mappings
  F50_CONFIG.diagnosisMappings.forEach((mapping) => {
    const value = mapDiagnosisF50(encounter, mapping);
    if (value) {
      defaultDataValues.push({
        dataElement: mapping.de,
        value: value,
      });
    }
  });

  // Observed complication (multi-select, up to 4 slots) - optionSet YW1t64pNlUH
  fillSlots(
    "ec9ffc6e-22c9-4489-ab88-c517460e7838",
    "rfe-forms-observedComplication",
    ["as6ICto55cO", "y8TsEYlp5ai", "U4N9k9q8iM8", "M3rXGXDLVjx"],
    "YW1t64pNlUH"
  );

  // Medication (multi-select, up to 10 slots) - optionSet z8NoIBE61lI
  fillSlots(
    "ae1e4603-7ab4-4ed1-902e-eee33a9c5eef",
    "rfe-forms-medicationPrescribedInCurrentConsultation",
    [
      "gipSPNNghXK",
      "sZastBLPgJY",
      "SHEM1CY8873",
      "HIfDsB1IsSk",
      "X5Owq7U5Y4E",
      "cRm0JmltkJX",
      "TzL2jbQo6nH",
      "E1dUkfQ2v47",
      "H8E7EJgibdt",
      "ScOa7FiWJTm",
    ],
    "z8NoIBE61lI"
  );

  // Referral specialist type (multi-select, up to 3 slots) - optionSet cWcZ5KAXfub
  fillSlots(
    "8fb3bb7d-c935-4b57-8444-1b953470e109",
    "rfe-forms-referralSpecialistType",
    ["TsG88CXqaii", "GeqxZYGIjPC", "QThCIIp4FRC"],
    "cWcZ5KAXfub"
  );

  // "If other specialist type specify" - fill slot N when Nth referral type is 'Other specialist'
  // TODO: add guard (obs.value?.uuid === '<Other-UUID>') once the 'Other specialist' answer UUID is known
  const referralSpecialistObs = encounter.obs.filter(
    (o) =>
      o.concept.uuid === "8fb3bb7d-c935-4b57-8444-1b953470e109" &&
      o.formFieldPath === "rfe-forms-referralSpecialistType"
  );
  const specialistOtherText = findAnswerByConcept(
    encounter,
    "790b41ce-e1e7-11e8-b02f-0242ac130002",
    "rfe-forms-specialistIfOtherPleaseSpecify"
  );
  if (specialistOtherText) {
    const otherSpecialistSlots = ["u68lzJcSaBa", "PO19ZbOBOO1", "OdrZUtuEaUU"];
    referralSpecialistObs.forEach((_obs, i) => {
      if (i >= otherSpecialistSlots.length) return;
      defaultDataValues.push({
        dataElement: otherSpecialistSlots[i],
        value: specialistOtherText,
      });
    });
  }

  // PREGNANCY STAGE
  const pregnancyEvent =
    syncType === "latest"
      ? events?.find(
          (e) => e.programStage === F50_CONFIG.pregnancyStage.programStage
        )?.event
      : undefined;
  const pregnancyDataValues = [];

  F50_CONFIG.pregnancyStage.mappings.forEach((mapping) => {
    const value = dataValueByConcept(
      encounter,
      {
        dataElement: mapping.de,
        conceptUuid: mapping.concept,
        questionId: mapping.qid,
      },
      state
    );

    if (value !== undefined && value !== null) {
      pregnancyDataValues.push({
        dataElement: mapping.de,
        value,
      });
    }
  });

  // INVESTIGATION RESULTS STAGE
  const investigationEvent =
    syncType === "latest"
      ? events?.find(
          (e) => e.programStage === F50_CONFIG.investigationStage.programStage
        )?.event
      : undefined;
  const investigationDataValues = [];

  // Simple values (numeric)
  F50_CONFIG.investigationStage.simpleValues.forEach((mapping) => {
    const obs = encounter.obs.find(
      (o) =>
        o.concept.uuid === mapping.concept && o.formFieldPath === mapping.qid
    );

    if (obs?.value !== undefined && obs?.value !== null) {
      investigationDataValues.push({
        dataElement: mapping.de,
        value: obs.value,
      });
    }
  });

  // TRUE_ONLY values
  F50_CONFIG.investigationStage.trueOnly.forEach((mapping) => {
    const obs = encounter.obs.find(
      (o) =>
        o.concept.uuid === mapping.concept && o.formFieldPath === mapping.qid
    );
    if (obs && ["yes", "true"].includes(obs?.value?.display?.toLowerCase())) {
      investigationDataValues.push({
        dataElement: mapping.de,
        value: "TRUE",
      });
    }
  });

  // Coded values
  F50_CONFIG.investigationStage.codedValues.forEach((mapping) => {
    const value = dataValueByConcept(
      encounter,
      {
        dataElement: mapping.de,
        conceptUuid: mapping.concept,
        questionId: mapping.qid,
      },
      state
    );
    if (value) {
      investigationDataValues.push({
        dataElement: mapping.de,
        value,
      });
    }
  });

  // RETURN EVENTS
  return [
    {
      event: defaultEvent,
      programStage,
      dataValues: defaultDataValues.filter((d) => d.value),
    },
    {
      event: events?.find((e) => e.programStage === "ecvF615g1jZ")?.event,
      programStage: "ecvF615g1jZ",
      dataValues: [
        {
          dataElement: dataEl.ncdEventDate,
          value: findAnswerByConcept(
            encounter,
            "1f473371-613f-4ef3-b297-49eb779ccd27"
          ),
        },
        {
          dataElement: dataEl.f50.typeOfExit,
          value: findAnswerByConcept(
            encounter,
            "4f4c6be4-1e1a-4770-a73b-bcc69c171748"
          ),
        },
        {
          dataElement: dataEl.f50.ifDefaulterSpecify,
          value: findAnswerByConcept(
            encounter,
            "f50f7325-53ed-45a5-bb41-f0987b296c5f"
          ),
        },
      ].filter((d) => d.value),
    },
    ...(pregnancyDataValues.length > 0
      ? [
          {
            event: pregnancyEvent,
            programStage: F50_CONFIG.pregnancyStage.programStage,
            dataValues: pregnancyDataValues,
          },
        ]
      : []),
    ...(investigationDataValues.length > 0
      ? [
          {
            event: investigationEvent,
            programStage: F50_CONFIG.investigationStage.programStage,
            dataValues: investigationDataValues,
          },
        ]
      : []),
  ];
}

function mapF55(encounter, events, state) {
  const programStage = state.formMaps[encounter.form.uuid]?.programStage;
  const event = events?.find((e) => e.programStage === programStage)?.event;

  const encounterDate = encounter.encounterDatetime.replace("+0000", "");
  return [
    {
      event,
      programStage,
      dataValues: [
        {
          dataElement: "z62bfjOA5CD",
          value: encounterDate,
        },
      ],
    },
  ];
}

function mapF56(encounter, events, state) {
  const event = events?.find((e) => e.programStage === "d5sMByjqQFm")?.event;

  return [
    {
      event,
      programStage: "d5sMByjqQFm",
      dataValues: [
        {
          dataElement: "W450u7KdzUz",
          value: encounter.encounterDatetime.replace("+0000", ""),
        },
        {
          dataElement: "WaPztwF7kGN",
          value: findAnswerByConcept(
            encounter,
            "4f4c6be4-1e1a-4770-a73b-bcc69c171748"
          ),
        },
        {
          dataElement: "Gl1axYBX5gV",
          value: findAnswerByConcept(
            encounter,
            "0f478fde-1219-4815-9481-f507e8457c38"
          ),
        },
        {
          dataElement: "psbKn33o6yi",
          value: findAnswerByConcept(
            encounter,
            "ef0b1e26-411e-40d5-bd98-8762f92c22d0"
          ),
        },
      ].filter((d) => d.value),
    },
  ];
}

function mapF58(encounter, events, state) {
  const event = events?.find((e) => e.programStage === "Rd73a6zlYEy")?.event;

  return [
    {
      event,
      programStage: "Rd73a6zlYEy",
      dataValues: [
        {
          dataElement: "gn40F7cEQTI",
          // value: encounter.encounterDatetime.replace("+0000", ""),
          value: dataValueByConcept(
            encounter,
            {
              dataElement: "gn40F7cEQTI",
              conceptUuid: "4f4c6be4-1e1a-4770-a73b-bcc69c171748",
              questionId: "rfe-forms-typeOfExit",
            },
            state
          ),
        },
        {
          dataElement: "rmYRcxE5I5G",
          value: dataValueByConcept(
            encounter,
            {
              dataElement: "rmYRcxE5I5G",
              conceptUuid: "0f478fde-1219-4815-9481-f507e8457c38",
              questionId: "rfe-forms-ifDiscontinuationProvideTheReason",
            },
            state
          ),
          // value: findAnswerByConcept(
          //   encounter,
          //   "0f478fde-1219-4815-9481-f507e8457c38"
          // ),
        },
      ].filter((d) => d.value),
    },
  ];
}

function mapF59(encounter, events, state) {
  const form = state.formMaps[encounter.form.uuid];
  const defaultProgramStage = form?.programStage;
  const syncType = form?.syncType;

  // Get raw values using dataValueByConcept with concept + questionId pattern
  const typeOfIncomeRaw = dataValueByConcept(
    encounter,
    {
      dataElement: "CttkesLrFyG",
      conceptUuid: "f501e482-d6cd-45d7-be5d-ef6e09461380",
      questionId: "rfe-forms-typeOfIncome",
    },
    state
  );

  const usedDrugRaw = dataValueByConcept(
    encounter,
    {
      dataElement: "Ir0qLWsNv4n",
      conceptUuid: "30837713-453e-4456-ac48-b3886acf02ac",
      questionId: "rfe-forms-hasThePatientEverUsedAnyDrugOrSubstance",
    },
    state
  );

  // Apply custom logic for Type of Income
  // Fill DHIS2 with 'Employment' if the answer is 'Full time job' or 'Part time job'
  const typeOfIncomeValue = ["full time", "part time"].some((keyword) =>
    typeOfIncomeRaw?.toLowerCase()?.includes(keyword)
  )
    ? "Employment"
    : null;

  // Apply custom logic for Drug Use
  // Fill DHIS2 with 'Yes' if the answer is 'Yes, in the past' or 'Yes, currently'
  const usedDrugValue = ["in the past", "currently"].some((keyword) =>
    usedDrugRaw?.toLowerCase()?.includes(keyword)
  )
    ? "Yes"
    : null;

  const defaultEvent = {
    event:
      syncType === "latest"
        ? events?.find((e) => e.programStage === defaultProgramStage)?.event
        : undefined,
    programStage: defaultProgramStage,
    dataValues: [
      {
        dataElement: "CttkesLrFyG",
        value: typeOfIncomeValue,
      },
      {
        dataElement: "Ir0qLWsNv4n",
        value: usedDrugValue,
      },
    ].filter((d) => d.value),
  };

  // Discharge event mappings
  const event =
    syncType === "latest"
      ? events?.find((e) => e.programStage === "sBepdVG2c9O")?.event
      : undefined;

  const dischargeDate = encounter.obs.find(
    (o) =>
      o.concept.uuid === "13cea1c8-e426-411f-95b4-33651fc4325d" &&
      o.formFieldPath === "rfe-forms-dateOfDischarge"
  )?.value;

  const typeOfExit = dataValueByConcept(
    encounter,
    {
      dataElement: "LhgHv4gjW18",
      conceptUuid: "4f4c6be4-1e1a-4770-a73b-bcc69c171748",
      questionId: "rfe-forms-typeOfExit",
    },
    state
  );

  const typeOfExitOther = dataValueByConcept(
    encounter,
    {
      dataElement: "k64e6bcyPtH",
      conceptUuid: CONCEPTS.OTHER,
      questionId: "rfe-forms-typeOfExitIfOtherSpecify",
    },
    state
  );

  const exitEvent = {
    event,
    programStage: "sBepdVG2c9O",
    occurredAt: encounter.encounterDatetime.replace("+0000", ""),
    dataValues: [
      {
        dataElement: "JvgfNjNklmI",
        value: dischargeDate,
      },
      {
        dataElement: "LhgHv4gjW18",
        value: typeOfExit,
      },
      {
        dataElement: "k64e6bcyPtH",
        value: typeOfExitOther,
      },
    ].filter((d) => d.value),
  };
  return [defaultEvent, exitEvent];
}

function mapF60(encounter, events, state) {
  const form = state.formMaps[encounter.form.uuid];
  const syncType = form?.syncType;
  const event =
    syncType === "latest"
      ? events?.find((e) => e.programStage === "sBepdVG2c9O")?.event
      : undefined;
  const defaultProgramStage = form?.programStage;

  const dischargeDate = encounter.obs.find(
    (o) =>
      o.concept.uuid === "13cea1c8-e426-411f-95b4-33651fc4325d" &&
      o.formFieldPath === "rfe-forms-dateOfDischarge"
  )?.value;

  const typeOfExit = dataValueByConcept(
    encounter,
    {
      dataElement: "LhgHv4gjW18",
      conceptUuid: "4f4c6be4-1e1a-4770-a73b-bcc69c171748",
      questionId: "rfe-forms-typeOfExit",
    },
    state
  );

  const typeOfExitOther = dataValueByConcept(
    encounter,
    {
      dataElement: "k64e6bcyPtH",
      conceptUuid: CONCEPTS.OTHER,
      questionId: "rfe-forms-typeOfExitIfOtherSpecify",
    },
    state
  );

  const defaultEvent = {
    event:
      syncType === "latest"
        ? events?.find((e) => e.programStage === defaultProgramStage)?.event
        : undefined,
    programStage: defaultProgramStage,
    occurredAt: encounter.encounterDatetime.replace("+0000", ""),
    dataValues: [],
  };

  const exitEvent = {
    event,
    programStage: "sBepdVG2c9O",
    occurredAt: encounter.encounterDatetime.replace("+0000", ""),
    dataValues: [
      {
        dataElement: "JvgfNjNklmI",
        value: dischargeDate,
      },
      {
        dataElement: "LhgHv4gjW18",
        value: typeOfExit,
      },
      {
        dataElement: "k64e6bcyPtH",
        value: typeOfExitOther,
      },
    ].filter((d) => d.value),
  };

  return [defaultEvent, exitEvent];
}

// F62 Configuration
const F62_CONFIG = {
  // Default stage - Other Support section
  defaultStage: {
    concept: "6b3cf530-e574-419a-9dd4-2c8d3ad69562",
    // Special nursing care mapping (TEXT type, stays in default stage)
    nursingCare: {
      de: "PG9mocTexDK",
      dressingAnswer: "d592dcaf-ae83-4acc-921e-127aa27545b5", // Dressing
      otherNursingCareAnswer: "42131f0e-c9e2-492c-820e-bd7ff6b9180f", // Other nursing care
    },
  },

  // Hospitalisation stage
  hospitalisationStage: {
    programStage: "YivvTlIw5Ep",
    timeDataElement: "d3BwrZYHAbK",
    simpleValues: [
      {
        de: "NHBJjpIXPBI",
        concept: "b996944c-b136-4e8e-9068-562476a0595a",
        qid: "rfe-forms-reasonOfHospitalisation",
      }, // Reason of hospitalisation
      {
        de: "LPIyv58pWVg",
        concept: "13cea1c8-e426-411f-95b4-33651fc4325d",
        qid: "rfe-forms-dateOfDischarge",
      }, // Date of discharge
      {
        de: "nrqutHXxAUk",
        concept: "09a06404-afc5-457a-91b9-54152e45a854",
        qid: "rfe-forms-typeOfDischarge",
      }, // Type of discharge
    ],
    customValues: [
      {
        de: "RSQqK2yZGz6",
        concept: "c149755e-dd32-43b0-b643-ab14aa483207",
        qid: "rfe-forms-admissionToWard",
        type: "text",
      }, // Admission to ward
    ],
  },

  // Exit stage
  exitStage: {
    programStage: "Otoff7Cj8JQ",
    simpleValues: [
      {
        de: "iGsz0Q3b0HC",
        concept: "1f473371-613f-4ef3-b297-49eb779ccd27",
        qid: "rfe-forms-dateOfExit",
      }, // Date of Exit
      {
        de: "mpiPBwCu6Xa",
        concept: "9e861ef1-e07c-4955-9650-2ebac3138fc3",
        qid: "rfe-forms-outcome",
      }, // Outcome
      {
        de: "d8eoys0WPgR",
        concept: "a844ff25-b3fb-4873-9681-f2f35f5159ec",
        qid: "rfe-forms-reasonForDischarge",
      }, // Reason for discharge
      {
        de: "p1t7OpwVBcl",
        concept: "778b70b5-c6de-4459-a101-6bf02f77d5c7",
        qid: "rfe-forms-deathCause",
      }, // Death cause
    ],
  },
};

function mapF62(encounter, events) {
  const form = state.formMaps[encounter.form.uuid];
  const syncType = form?.syncType;
  const defaultProgramStage = form?.programStage;

  // DEFAULT STAGE - Other Support
  const defaultDataValues = [];

  // Add nursing care special logic (stays in default stage)
  const dressingValue = conceptAndValueTrueOnly(
    encounter,
    F62_CONFIG.defaultStage.concept,
    F62_CONFIG.defaultStage.nursingCare.dressingAnswer
  );
  const otherNursingCareValue = conceptAndValueTrueOnly(
    encounter,
    F62_CONFIG.defaultStage.concept,
    F62_CONFIG.defaultStage.nursingCare.otherNursingCareAnswer
  );
  if (dressingValue) {
    defaultDataValues.push({
      dataElement: F62_CONFIG.defaultStage.nursingCare.de,
      value: "dressing",
    });
  } else if (otherNursingCareValue) {
    defaultDataValues.push({
      dataElement: F62_CONFIG.defaultStage.nursingCare.de,
      value: "other",
    });
  }

  const defaultEvent = {
    event:
      syncType === "latest"
        ? events?.find((e) => e.programStage === defaultProgramStage)?.event
        : undefined,
    programStage: defaultProgramStage,
    dataValues: defaultDataValues,
  };

  // HOSPITALISATION STAGE
  const hospitalisationDataValues = [];

  // Add time data element
  if (encounter.encounterDatetime) {
    hospitalisationDataValues.push({
      dataElement: F62_CONFIG.hospitalisationStage.timeDataElement,
      value: encounter.encounterDatetime.replace("+0000", "").substring(11, 19),
    });
  }

  // Add simple values
  F62_CONFIG.hospitalisationStage.simpleValues.forEach((mapping) => {
    const value = findAnswerByConcept(encounter, mapping.concept, mapping.qid);
    if (value) {
      hospitalisationDataValues.push({
        dataElement: mapping.de,
        value,
      });
    }
  });
  F62_CONFIG.hospitalisationStage.customValues.forEach((mapping) => {
    const value = dataValueByConcept(
      encounter,
      {
        dataElement: mapping.de,
        conceptUuid: mapping.concept,
        questionId: mapping.qid,
        type: mapping.type,
      },
      state
    );
    if (value) {
      hospitalisationDataValues.push({
        dataElement: mapping.de,
        value,
      });
    }
  });

  const hospitalisationEvent = {
    event:
      syncType === "latest"
        ? events?.find(
            (e) =>
              e.programStage === F62_CONFIG.hospitalisationStage.programStage
          )?.event
        : undefined,
    programStage: F62_CONFIG.hospitalisationStage.programStage,
    occurredAt: encounter.encounterDatetime.replace("+0000", ""),
    dataValues: hospitalisationDataValues,
  };

  // EXIT STAGE
  const exitDataValues = [];

  F62_CONFIG.exitStage.simpleValues.forEach((mapping) => {
    const value = findAnswerByConcept(encounter, mapping.concept, mapping.qid);
    if (value) {
      exitDataValues.push({
        dataElement: mapping.de,
        value,
      });
    }
  });

  const exitEvent = {
    event: events?.find(
      (e) => e.programStage === F62_CONFIG.exitStage.programStage
    )?.event,
    programStage: F62_CONFIG.exitStage.programStage,
    dataValues: exitDataValues,
  };

  return [defaultEvent, hospitalisationEvent, exitEvent];
}

// F63 Configuration
const F63_CONFIG = {
  // Default stage - Other Support section
  defaultStage: {
    concept: "6b3cf530-e574-419a-9dd4-2c8d3ad69562", // Same concept as F62
    // Special nursing care mapping (TEXT type, stays in default stage, DIFFERENT UID from F62)
    nursingCare: {
      de: "LIlfhZdkMpB",
      dressingAnswer: "d592dcaf-ae83-4acc-921e-127aa27545b5", // Dressing
      otherNursingCareAnswer: "42131f0e-c9e2-492c-820e-bd7ff6b9180f", // Other nursing care
    },
  },

  // Hospitalisation stage (SAME as F62)
  hospitalisationStage: {
    programStage: "YivvTlIw5Ep",
    timeDataElement: "d3BwrZYHAbK",
    simpleValues: [
      {
        de: "NHBJjpIXPBI",
        concept: "b996944c-b136-4e8e-9068-562476a0595a",
        qid: "rfe-forms-reasonOfHospitalisation",
      }, // Reason of hospitalisation
      {
        de: "LPIyv58pWVg",
        concept: "13cea1c8-e426-411f-95b4-33651fc4325d",
        qid: "rfe-forms-dateOfDischargeFromHospital",
      }, // Date of discharge
      {
        de: "nrqutHXxAUk",
        concept: "09a06404-afc5-457a-91b9-54152e45a854",
        qid: "rfe-forms-typeOfDischarge",
      }, // Type of discharge
    ],
    customValues: [
      {
        de: "RSQqK2yZGz6",
        concept: "c149755e-dd32-43b0-b643-ab14aa483207",
        qid: "rfe-forms-admissionToWard",
        type: "text",
      }, // Admission to ward
    ],
  },

  // Exit stage (SAME as F62)
  exitStage: {
    programStage: "Otoff7Cj8JQ",
    simpleValues: [
      {
        de: "iGsz0Q3b0HC",
        concept: "1f473371-613f-4ef3-b297-49eb779ccd27",
        qid: "rfe-forms-dateOfExit",
      }, // Date of Exit
      {
        de: "mpiPBwCu6Xa",
        concept: "9e861ef1-e07c-4955-9650-2ebac3138fc3",
        qid: "rfe-forms-outcome",
      }, // Outcome
      {
        de: "d8eoys0WPgR",
        concept: "a844ff25-b3fb-4873-9681-f2f35f5159ec",
        qid: "rfe-forms-reasonForDischarge",
      }, // Reason for discharge
      {
        de: "p1t7OpwVBcl",
        concept: "778b70b5-c6de-4459-a101-6bf02f77d5c7",
        qid: "rfe-forms-deathCause",
      }, // Death cause
    ],
  },
};

function mapF63(encounter, events, state) {
  const form = state.formMaps[encounter.form.uuid];
  const syncType = form?.syncType;
  const defaultProgramStage = form?.programStage;

  // DEFAULT STAGE - Other Support
  const defaultDataValues = [];

  // Add nursing care special logic (stays in default stage)
  const dressingValue = conceptAndValueTrueOnly(
    encounter,
    F63_CONFIG.defaultStage.concept,
    F63_CONFIG.defaultStage.nursingCare.dressingAnswer
  );
  const otherNursingCareValue = conceptAndValueTrueOnly(
    encounter,
    F63_CONFIG.defaultStage.concept,
    F63_CONFIG.defaultStage.nursingCare.otherNursingCareAnswer
  );
  if (dressingValue) {
    defaultDataValues.push({
      dataElement: F63_CONFIG.defaultStage.nursingCare.de,
      value: "dressing",
    });
  } else if (otherNursingCareValue) {
    defaultDataValues.push({
      dataElement: F63_CONFIG.defaultStage.nursingCare.de,
      value: "other",
    });
  }

  const defaultEvent = {
    event:
      syncType === "latest"
        ? events?.find((e) => e.programStage === defaultProgramStage)?.event
        : undefined,
    programStage: defaultProgramStage,
    dataValues: defaultDataValues,
  };

  // HOSPITALISATION STAGE
  const hospitalisationDataValues = [];

  // Add time data element
  if (encounter.encounterDatetime) {
    hospitalisationDataValues.push({
      dataElement: F63_CONFIG.hospitalisationStage.timeDataElement,
      value: encounter.encounterDatetime.replace("+0000", "").substring(11, 19),
    });
  }

  // Add simple values
  F63_CONFIG.hospitalisationStage.simpleValues.forEach((mapping) => {
    const value = findAnswerByConcept(encounter, mapping.concept, mapping.qid);
    if (value) {
      hospitalisationDataValues.push({
        dataElement: mapping.de,
        value,
      });
    }
  });

  F63_CONFIG.hospitalisationStage.customValues.forEach((mapping) => {
    const value = dataValueByConcept(
      encounter,
      {
        dataElement: mapping.de,
        conceptUuid: mapping.concept,
        questionId: mapping.qid,
        type: mapping.type,
      },
      state
    );
    if (value) {
      hospitalisationDataValues.push({
        dataElement: mapping.de,
        value,
      });
    }
  });

  const hospitalisationEvent = {
    event:
      syncType === "latest"
        ? events?.find(
            (e) =>
              e.programStage === F63_CONFIG.hospitalisationStage.programStage
          )?.event
        : undefined,
    programStage: F63_CONFIG.hospitalisationStage.programStage,
    occurredAt: encounter.encounterDatetime.replace("+0000", ""),
    dataValues: hospitalisationDataValues,
  };

  // EXIT STAGE
  const exitDataValues = [];

  F63_CONFIG.exitStage.simpleValues.forEach((mapping) => {
    const value = findAnswerByConcept(encounter, mapping.concept, mapping.qid);
    if (value) {
      exitDataValues.push({
        dataElement: mapping.de,
        value,
      });
    }
  });

  const exitEvent = {
    event: events?.find(
      (e) => e.programStage === F63_CONFIG.exitStage.programStage
    )?.event,
    programStage: F63_CONFIG.exitStage.programStage,
    dataValues: exitDataValues,
  };

  return [defaultEvent, hospitalisationEvent, exitEvent];
}

fn((state) => {
  // Initialize array to track missing DHIS2 Option Codes
  state.missingOptsets ??= [];

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
  console.log("Total encounters:", state.encounters.length);

  state.eventsMapping = state.encounters
    .map((encounter, index) => {
      console.log(`Processing encounter ${index}:`, encounter.form.uuid);

      const form = state.formMaps[encounter.form.uuid];
      if (!form?.dataValueMap) {
        return null;
      }
      const program = state.formMaps[encounter.form.uuid].programId;
      const orgUnit = state.formMaps[encounter.form.uuid].orgUnit;
      const patientOuProgram = `${orgUnit}-${program}-${encounter.patient.uuid}`;
      const { trackedEntity, enrollments } =
        state.existingTeis[patientOuProgram] || {};
      const enrollment = enrollments?.[0]?.enrollment;
      const events = enrollments?.[0]?.events;

      if (!trackedEntity || !enrollment) {
        console.log(
          `❌ Missing TEI data for patient ${encounter.patient.uuid}`
        );

        handleMissingRecord(encounter, state);
        return null;
      }
      console.log(`✅ Processing encounter ${index} successfully`);

      const formDataElements = Object.keys(form.dataValueMap);
      let formDataValues = formDataElements
        .map((dataElement) => {
          const value = findDataValue(encounter, dataElement, state);
          if (value !== null && value !== undefined && value !== "") {
            return { dataElement, value };
          }
        })
        .filter((dv) => {
          return (
            dv?.value &&
            !["pj5hIE6iyAR", "KjgDauY9v4J", "DYTLOoEKRas"].includes(
              dv?.dataElement
            )
          );
        });

      const multiSelectDvs = multiSelectAns(encounter, form.multiSelectQns);
      const customMapping = [
        mapF13(encounter, state.optsMap),
        mapF18(encounter, state.encounters),
        mapF16(encounter),
        mapF17(encounter),
        mapF29(encounter),
        mapF22(encounter),
        mapF37(encounter),
        mapF38(encounter),
        mapF30F29(encounter, state.allEncounters),
        mapF32F31(encounter, state.allEncounters),
        mapF33F34(encounter, state.allEncounters),
        mapF40(encounter),
      ]
        .filter(Boolean) // Only include non-empty mappings
        .flat(); // flattening the array

      const latestFormEvent = events.find(
        (e) => e.programStage === form.programStage
      )?.event;

      const encounterEvent = events.find(
        (e) =>
          e.programStage === form.programStage &&
          e.occurredAt === encounter.encounterDatetime.replace("+0000", "")
      )?.event;

      const event =
        form.syncType === "latest" ? latestFormEvent : encounterEvent;
      const formEvent = {
        event,
        program,
        orgUnit,
        trackedEntity,
        enrollment,
        occurredAt: encounter.encounterDatetime.replace("+0000", ""),
        programStage: form.programStage,
        dataValues: [
          ...formDataValues,
          ...customMapping,
          ...multiSelectDvs,
        ].filter((d) => d?.value),
      };

      const exitFormEvents = buildExitEvent(
        encounter,
        {
          program,
          orgUnit,
          trackedEntity,
          enrollment,
          events,
        },
        state
      );

      const mappings = [
        formEvent,
        ...exitFormEvents.map((e) => {
          return { ...e, dataValues: e.dataValues.filter((d) => d.value) };
        }),
      ];

      return mappings;
    })
    .flat()
    .filter(Boolean);
  console.log("Final eventsMapping length:", state.eventsMapping.length);

  return state;
});

const mergeEvents = (events) => {
  const eventMap = new Map();

  events.forEach((event) => {
    // Create a unique key based on all properties except dataValues
    const key = JSON.stringify({
      program: event.program,
      orgUnit: event.orgUnit,
      trackedEntity: event.trackedEntity,
      enrollment: event.enrollment,
      occurredAt: event.occurredAt,
      programStage: event.programStage,
    });

    if (eventMap.has(key)) {
      // Merge dataValues if event already exists
      const existing = eventMap.get(key);
      existing.dataValues = [...existing.dataValues, ...event.dataValues];
    } else {
      // Add new event to map
      eventMap.set(key, { ...event });
    }
  });

  return Array.from(eventMap.values());
};

// Combinining events and exit events
fn((state) => {
  const { data, references, response, ...rest } = state;
  rest.eventsMapping = mergeEvents(rest.eventsMapping);
  return rest;
});

fnIf(
  (state) => state.missingOptsets.length > 0 && state.testMode,
  (state) => {
    console.log("⚠️  Missing DHIS2 Option Code");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    state.missingOptsets.forEach((opt) => {
      console.log({
        openMrsQuestion: opt.openMrsQuestion,
        answerDisplay: opt.answerDisplay,
        answerValueUuid: opt.answerValueUuid,
        dhis2DataElementUid: opt.dhis2DataElementUid,
        dhis2OptionSetUid: opt.dhis2OptionSetUid,
        formName: opt.metadataFormName,
        optionSetKey: opt.optionKey,
      });
    });
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return state;
  }
);
