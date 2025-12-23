const findAnswerByConcept = (encounter, conceptUuid) => {
  const answer = encounter.obs.find((o) => o.concept.uuid === conceptUuid);
  //Mtuchi: Todo need to filter from optsMaps
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

function mapF11(encounter, optsMap) {
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

function mapF13(encounter, optsMap) {
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

function mapF16(encounter) {
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

function mapF17(encounter) {
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

function mapF18(encounter, encounters) {
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

function mapF22(encounter) {
  const answers = filterObsByConcept(
    encounter,
    "38d5dcf5-b8bf-420e-bb14-a270e1f518b3"
  ).map((o) => o.value.display);

  if (answers.length === 0) {
    return;
  }
  // Define mapping configurations
  const mappingConfig = [
    { dataElement: "y5EEruMtgG1", has: "None" },
    { dataElement: "SqCZBLTRSt7", has: "Ventilation" },
    { dataElement: "hW2US5pqO9c", has: "Cardiac massage" },
    { dataElement: "ZgzXA4TjsDg", has: "Adrenaline" },
    { dataElement: "BYxj9JiIETF", has: "Other" },
  ];

  return mappingConfig
    .map((config) => {
      if (answers.some((a) => a.includes(config.has))) {
        return {
          dataElement: config.dataElement,
          value: true,
        };
      }
    })
    .filter(Boolean);
}

function mapF29(encounter, optsMap) {
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

function mapF30F29(encounter, allEncounters) {
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

function mapF32F31(encounter, allEncounters) {
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

function mapF33F34(encounter, allEncounters) {
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

function mapF37(encounter) {
  const answers = filterObsByConcept(
    encounter,
    "d30db8b8-f8fb-450c-9562-629195212a45"
  ).map((o) => o.value.display);

  if (answers.length === 0) {
    return;
  }
  const mappingConfig = [
    { dataElement: "MATDmdd9lRR", has: "Medical induction" },
    { dataElement: "DNQWSGBOBQB", has: "Unassisted induction" },
    { dataElement: "ts3xCk7k7x0", has: "Artificial rupture of membrane" },
    { dataElement: "p59TQ8PvXVH", has: "Dilatation and curettage" },
    { dataElement: "Uby3bOB4hFn", has: "Prepare for C-section" },
    { dataElement: "G2XoPI8Onh6", has: "Prepare for emergency C-section" },
    { dataElement: "cLo2RytNPE9", has: "Deferred admission" },
    { dataElement: "xB4S4ZVgAbm", has: "External referral" },
    { dataElement: "HgexHDb2auE", has: "Other" },
  ];

  const f37Mapping = mappingConfig
    .map((config) => {
      if (answers.some((a) => a.includes(config.has))) {
        return {
          dataElement: config.dataElement,
          value: true,
        };
      }
    })
    .filter(Boolean);

  return f37Mapping;
}

function mapF38(encounter) {
  const procedureAnswers = filterObsByConcept(
    encounter,
    "482af9e6-795d-42d9-be5b-64f4df54a63e"
  ).map((o) => o.value.display);

  const anaesthesiaAnswers = filterObsByConcept(
    encounter,
    "84cc236e-90fa-4eec-acf5-d0cd6b713dc4"
  ).map((o) => o.value.display);

  let f38Mapping = [];
  if (procedureAnswers.length > 1) {
    const procedureConfig = [
      {
        dataElement: "JshMCeD8bNx",
        has: "FGM / female circumcision management",
      },
      { dataElement: "oxXdt4qFPUT", has: "Episiotomy" },
      { dataElement: "puJfC1hX0CN", has: "Induction of labor" },
      {
        dataElement: "ncgztSFld2L",
        has: "Oxytocin for augmentation of labour",
      },
      {
        dataElement: "cQsT8zdLu6s",
        has: "VBAC (Vaginal birth after Caesearan)",
      },
      { dataElement: "BvfOhTNVitn", has: "Vaginal breech delivery" },
      { dataElement: "RHSujdOFWre", has: "Twins / triplets vaginal delivery" },
      { dataElement: "z1Bej1f1gCu", has: "Maneuver" },
      { dataElement: "JHZVr6SECp3", has: "Manual exploration of uterus" },
      { dataElement: "RiSel8y1SuF", has: "Curettage" },
      {
        dataElement: "DxnQSPcbxdF",
        has: "Laceration (perineal tear) repaired",
      },
      { dataElement: "IIoljELzj95", has: "Cervical tear repair" },
      { dataElement: "Lvk3ipAxiAH", has: "Tubal ligation (sterilization)" },
    ];
    const procedureMapping = procedureConfig
      .map((config) => {
        if (procedureAnswers.some((a) => a.includes(config.has))) {
          return {
            dataElement: config.dataElement,
            value: true,
          };
        }
      })
      .filter(Boolean);
    f38Mapping.push(...procedureMapping);
  }

  if (anaesthesiaAnswers.length > 0) {
    const anaesthesiaConfig = [
      { dataElement: "kjg89ETfuSW", has: "General" },
      { dataElement: "bgauK1cE1HM", has: "Local" },
      { dataElement: "dBAXsq3kl3p", has: "Spinal" },
    ];
    const anaesthesiaMapping = anaesthesiaConfig
      .map((config) => {
        if (anaesthesiaAnswers.some((a) => a.includes(config.has))) {
          return {
            dataElement: config.dataElement,
            value: true,
          };
        }
      })
      .filter(Boolean);
    f38Mapping.push(...anaesthesiaMapping);
  }

  if (f38Mapping.length === 0) {
    return;
  }

  return f38Mapping;
}

function mapF49(encounter, mappings) {
  const { events, programStage, dhis2Map, optionSetKey, optsMap } = mappings;
  const dataEl = dhis2Map.de;
  const defaultEvent = events?.find(
    (e) => e.programStage === programStage
  )?.event;

  const consultationDate = encounter.obs.find(
    (o) => o.concept.uuid === "d329cd4b-a10f-4a4d-96b5-c907bf87e721"
  )?.value;

  const isReadmission =
    encounter.obs
      .find((o) => o.concept.uuid === "4dae5b12-070f-4153-b1ca-fbec906106e1")
      ?.value?.display?.toLowerCase() === "re-admission";

  const diagnosisMap = (encounter, extId, answerUuid) => {
    const diagnosis = encounter.obs.find((o) => o.concept.uuid === extId)?.value
      ?.display;
    if (diagnosis) {
      return diagnosis;
    }
    const diagnosisAtAdmission = encounter.obs.find((o) => {
      o.value.uuid === answerUuid &&
        o.concept.uuid === "22809b19-54ca-4d88-8d26-9577637c184e";
    })?.value;
    if (diagnosisAtAdmission) {
      return "uknown";
    }
    return "no";
  };

  const observedComplications = filterObsByConcept(
    encounter,
    "ec9ffc6e-22c9-4489-ab88-c517460e7838"
  ).map((o) => o.value.display);

  const medications = filterObsByConcept(
    encounter,
    "ae1e4603-7ab4-4ed1-902e-eee33a9c5eef"
  ).map((o) => o.value.display);

  const specialistTypes = filterObsByConcept(
    encounter,
    "8fb3bb7d-c935-4b57-8444-1b953470e109"
  ).map((o) => o.value.display);

  const ifOtherSpecialistTypes = filterObsByConcept(
    encounter,
    "790b41ce-e1e7-11e8-b02f-0242ac130002"
  ).map((o) => o.value.display);

  const defaultDataValues = [
    { dataElement: dataEl.ncdEventDate, value: consultationDate },
    { dataElement: "SjNE9mM7Yu4", value: isReadmission },
    {
      dataElement: "mjnK3aUJuTa",
      value: diagnosisMap(
        encounter,
        "fad7b56b-7633-4467-9e6a-17328278b580",
        "10f3b49c-c3dc-4aa7-857f-3f9bb7df8dd0"
      ),
    },
    {
      dataElement: dataEl.diabetesTypeI,
      value: diagnosisMap(
        encounter,
        "f9bd6164-18e9-41ce-97cd-45ff85d6f124",
        "ed1150fd-278f-4012-b3d7-a795ac9fac82"
      ),
    },
    {
      dataElement: dataEl.diabetesTypeII,
      value: diagnosisMap(
        encounter,
        "db973d66-e027-4238-87c9-fa6e53026d12",
        "f1ee73b2-08cb-4373-80ac-357a704d3608"
      ),
    },
    {
      dataElement: dataEl.gestationalDiabetes,
      value: diagnosisMap(
        encounter,
        "3a5da658-2750-4872-9499-3c9e858f5eb6",
        "diabetes mellitus in pregnancy"
      ),
    },
    {
      dataElement: dataEl.hypothyroidism,
      value: diagnosisMap(
        encounter,
        "10ea847e-58c7-4da0-a112-ee1f0883e31b",
        "aecac536-6eea-4de8-a450-a9ad9608514a"
      ),
    },
    {
      dataElement: dataEl.chronicKidneyDisease,
      value: diagnosisMap(
        encounter,
        "42e81b70-63ab-4387-aebe-90e20db918e7",
        "chronic kidney disease"
      ),
    },
    {
      dataElement: dataEl.asthma,
      value: diagnosisMap(
        encounter,
        "82a5dadc-77ea-4765-b766-fb1e0336a736",
        "c10a05bc-e814-4693-a789-1eb884270381"
      ),
    },
    {
      dataElement: dataEl.copd,
      value: diagnosisMap(
        encounter,
        "68b7e054-046a-4ec1-8c6a-b05d0480da47",
        "0d9a7323-b54a-4d2b-a231-e34fa54e3a54"
      ),
    },
    {
      dataElement: dataEl.cardiovascularDisease,
      value: diagnosisMap(
        encounter,
        "5078ef27-0826-46c2-ac50-30ebf25cb686",
        "6541ddce-0e3c-4b7d-ad52-2bfe18e24dd5"
      ),
    },
    {
      dataElement: dataEl.otherCardiovascularDisorder,
      value: diagnosisMap(
        encounter,
        "ada7c7aa-261c-4808-b3ec-1236952ad1da",
        "ada7c7aa-261c-4808-b3ec-1236952ad1da"
      ),
    },
    {
      dataElement: dataEl.heartfailure,
      value: diagnosisMap(
        encounter,
        "fe989a53-9788-46e9-a170-f1f4b7abfddf",
        "6a7a9d6a-e8b6-4ffb-8321-a56e9e4473e0"
      ),
    },
    {
      dataElement: dataEl.epilepsy,
      value: diagnosisMap(
        encounter,
        "09334f94-5efd-49f0-b494-68b9192f2fd8",
        "681cf0bc-5213-492a-8470-0a0b3cc324dd"
      ),
    },
    {
      dataElement: dataEl.otherNCD,
      value: () => {
        const conceptUuid = "37b7ceb1-2ebd-43c5-9be7-c1c5e29e1dbc";
        const obs = encounter.obs.find((o) => o.concept.uuid === conceptUuid);
        const optionKey = `${encounter.form.uuid}-${conceptUuid}-${obs.formFieldPath}`;
        const matchingOptionSet = optionSetKey[optionKey];
        const optCodeByExtId = optsMap.find(
          (o) =>
            o["value.uuid - External ID"] === conceptUuid &&
            o["DHIS2 Option Set UID"] === matchingOptionSet
        )?.["DHIS2 Option Code"];

        return optCodeByExtId;

        //   return diagnosisMap(
        //   encounter,
        //   "37b7ceb1-2ebd-43c5-9be7-c1c5e29e1dbc",
        //   "37b7ceb1-2ebd-43c5-9be7-c1c5e29e1dbc" // Other noncommunicable diseases
        // ),
      },
    },
    {
      dataElement: dataEl.depression,
      value: diagnosisMap(
        encounter,
        "d48039ad-1700-406d-b9c2-b3bf355d61f9",
        "2066f043-2f21-4c19-8c04-77301d7404f9"
      ),
    },
    {
      dataElement: dataEl.psychosis,
      value: diagnosisMap(
        encounter,
        "6c0beb80-d7bd-4580-8f36-b6ffee8661fe",
        "10336195-ecd9-45bc-b6b4-b08ff1498e1b"
      ),
    },
    {
      dataElement: dataEl.stressRelated,
      value: diagnosisMap(
        encounter,
        "7aff0f40-e039-43fb-971d-0c07ed9fcde1",
        "7aff0f40-e039-43fb-971d-0c07ed9fcde1" //stress-related disorder diagnosis status
      ),
    },
    {
      dataElement: dataEl.substanceDisorder,
      value: diagnosisMap(
        encounter,
        "43024c85-60c3-4dd0-acde-33d259ad1e33",
        "fcc01124-3d7b-4e6f-be35-50233a7f64cb" //substance-related disorders
      ),
    },
    {
      dataElement: dataEl.childAdolescence,
      value: diagnosisMap(
        encounter,
        "d30db8b8-f8fb-450c-9562-629195212a45",
        "fef73529-e631-4620-920b-ff7fc5d458da" //child & adolescent disorder diagnosis status
      ),
    },
    {
      dataElement: dataEl.selfHarm,
      value: diagnosisMap(
        encounter,
        "af23b916-3e95-4bd4-8804-a4b1649ff365",
        "b27187bd-e94a-4dbc-9a77-46c0cefad25a" //Self-harming behavior / Suicide attempt
      ),
    },
    {
      dataElement: dataEl.otherMH,
      value: diagnosisMap(
        encounter,
        "88fc3c44-9ad1-4d33-b4ea-d2223c906f42",
        "88fc3c44-9ad1-4d33-b4ea-d2223c906f42" //"Other mental health diseases"
      ),
    },

    {
      dataElement: dataEl.observedComplication1,
      value: observedComplications?.[0],
    },
    {
      dataElement: dataEl.observedComplication2,
      value: observedComplications?.[1],
    },
    {
      dataElement: dataEl.observedComplication3,
      value: observedComplications?.[2],
    },
    {
      dataElement: dataEl.observedComplication4,
      value: observedComplications?.[3],
    },

    {
      dataElement: dataEl.medication1,
      value: medications?.[0],
    },
    {
      dataElement: dataEl.medication2,
      value: medications?.[1],
    },
    {
      dataElement: dataEl.medication3,
      value: medications?.[2],
    },
    {
      dataElement: dataEl.medication4,
      value: medications?.[3],
    },
    {
      dataElement: dataEl.medication5,
      value: medications?.[4],
    },
    {
      dataElement: dataEl.medication6,
      value: medications?.[5],
    },
    {
      dataElement: dataEl.medication7,
      value: medications?.[6],
    },
    {
      dataElement: dataEl.medication8,
      value: medications?.[7],
    },
    {
      dataElement: dataEl.medication9,
      value: medications?.[8],
    },
    {
      dataElement: dataEl.medication10,
      value: medications?.[9],
    },
    {
      dataElement: dataEl.specialistType1,
      value: specialistTypes?.[0],
    },
    {
      dataElement: dataEl.specialistType2,
      value: specialistTypes?.[1],
    },
    {
      dataElement: dataEl.specialistType3,
      value: specialistTypes?.[2],
    },

    {
      dataElement: dataEl.ifOtherSpecialistType1,
      value: ifOtherSpecialistTypes?.[0],
    },
    {
      dataElement: dataEl.ifOtherSpecialistType2,
      value: ifOtherSpecialistTypes?.[1],
    },
    {
      dataElement: dataEl.ifOtherSpecialistType3,
      value: ifOtherSpecialistTypes?.[2],
    },
  ];

  return [
    {
      event: defaultEvent,
      programStage,
      dataValues: defaultDataValues.filter((d) => d.value),
    },
    {
      event: events?.find((e) => e.programStage === "RVgciZl54Aj")?.event,
      programStage: "RVgciZl54Aj",
      dataValues: [
        {
          dataElement: dataEl.estDeliveryDate,
          value: findAnswerByConcept(
            encounter,
            "4cc41121-74da-42ac-ab89-e8878db66020"
          ),
        },
        {
          dataElement: dataEl.antenatalConsultation,
          value: findAnswerByConcept(
            encounter,
            "bf704b21-d203-4fb8-9b90-a2c29caad61b"
          ),
        },
        {
          dataElement: dataEl.contraception,
          value: findAnswerByConcept(
            encounter,
            "422c3a5d-4f67-4cbf-9236-3b7bfdcd8e14"
          ),
        },
        {
          dataElement: dataEl.pregnancyMethod,
          value: findAnswerByConcept(
            encounter,
            "6afb5d27-3e86-42ff-bad1-38f90897e0b6"
          ),
        },
      ].filter((d) => d.value),
    },
    {
      event: events?.find((e) => e.programStage === "zqmLGzSPv3T")?.event,
      programStage: "zqmLGzSPv3T",
      dataValues: [
        {
          dataElement: dataEl.extremistFootExam,
          value: findAnswerByConcept(
            encounter,
            "3fe91b1d-3c94-4752-ac36-75d4e6af379c"
          ),
        },
        {
          dataElement: dataEl.hba1cValue,
          value: encounter.obs.find(
            (o) => o.concept.uuid === "033ff20d-4cc5-4da0-ad5e-c42ce25df1e1"
          )?.value,
        },
        {
          dataElement: dataEl.totalCholesterolValue,
          value: conceptTrueOnly(
            encounter,
            "9265064e-104f-431d-b50d-4cd8b7a39526"
          ),
        },
        {
          dataElement: dataEl.creatinineDone,
          value: conceptTrueOnly(
            encounter,
            "b20c05db-cc1e-41f8-abbe-cdd8fcef82cc"
          ),
        },
        {
          dataElement: dataEl.creatinineMgPerDl,
          value: encounter.obs.find(
            (o) => o.concept.uuid === "bc6f8c3a-80ad-46f2-ad76-bd4189ea61c7"
          )?.value,
        },
        {
          dataElement: dataEl.creatinineUmolPerl,
          value: encounter.obs.find(
            (o) => o.concept.uuid === "397b7cc1-9687-4796-a2a6-52d04f963e71"
          )?.value,
        },
        {
          dataElement: dataEl.creatinineEgfr,
          value: encounter.obs.find(
            (o) => o.concept.uuid === "910cf2bc-b9fe-4997-845f-409583bbd2fd"
          )?.value,
        },
        {
          dataElement: dataEl.creatinineMlPerMin,
          value: encounter.obs.find(
            (o) => o.concept.uuid === "ee8dd465-4f0c-4f81-9c9f-8dd1e419a9d8"
          )?.value,
        },

        {
          dataElement: dataEl.urineAnalysis,
          value: conceptTrueOnly(
            encounter,
            "19d395d5-9e2f-4f9b-9723-1fd64e879421"
          ),
        },
        {
          dataElement: dataEl.altDone,
          value: conceptTrueOnly(
            encounter,
            "41e0892a-3962-4ee6-8adc-b65322da183b"
          ),
        },
        {
          dataElement: dataEl.kDone,
          value: conceptTrueOnly(
            encounter,
            "e2826aa6-af7b-49cd-b3a3-5ffae92c202d"
          ),
        },
        {
          dataElement: dataEl.tshDone,
          value: conceptTrueOnly(
            encounter,
            "1b1ddab9-1463-4b79-9d25-b591bca6127e"
          ),
        },
        {
          dataElement: dataEl.inrDone,
          value: conceptTrueOnly(
            encounter,
            "382d6a15-1e60-43a3-8ee5-bb0f7b11b17b"
          ),
        },
        {
          dataElement: dataEl.ldlDone,
          value: conceptTrueOnly(
            encounter,
            "1ecf8c4a-c70c-4fa6-b840-2e13cdb217fe"
          ),
        },
        {
          dataElement: dataEl.ecg,
          value: findAnswerByConcept(
            encounter,
            "f5b2b5ff-47bb-41e1-bbcc-3d7b2ecb373f"
          ),
        },
        {
          dataElement: dataEl.echo,
          value: findAnswerByConcept(
            encounter,
            "b754e7bb-d425-4f62-988e-3bccc2abf332"
          ),
        },
      ].filter((d) => d.value),
    },
  ];
}

function mapF55(encounter, metadataMap) {
  const { events, programStage } = metadataMap;
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

function mapF56(encounter, metadataMap) {
  const { events } = metadataMap;
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

function mapF58(encounter, metadataMap) {
  const { events } = metadataMap;
  const event = events?.find((e) => e.programStage === "Rd73a6zlYEy")?.event;

  return [
    {
      event,
      programStage: "Rd73a6zlYEy",
      dataValues: [
        {
          dataElement: "gn40F7cEQTI",
          value: encounter.encounterDatetime.replace("+0000", ""),
        },
        {
          dataElement: "rmYRcxE5I5G",
          value: findAnswerByConcept(
            encounter,
            "0f478fde-1219-4815-9481-f507e8457c38"
          ),
        },
      ].filter((d) => d.value),
    },
  ];
}

function mapF59(encounter, metadataMap) {
  const { events } = metadataMap;

  const event = events?.find((e) => e.programStage === "sBepdVG2c9O")?.event;

  const typeOfIncome = findAnswerByConcept(
    encounter,
    "f501e482-d6cd-45d7-be5d-ef6e09461380"
  );

  const dischargeDate = encounter.obs.find(
    (o) => o.concept.uuid === "13cea1c8-e426-411f-95b4-33651fc4325d"
  )?.value;

  const usedDrug = findAnswerByConcept(
    encounter,
    "30837713-453e-4456-ac48-b3886acf02ac"
  );
  const typeOfExit = findAnswerByConcept(
    encounter,
    "4f4c6be4-1e1a-4770-a73b-bcc69c171748"
  );

  const typeOfExitOther = findAnswerByConcept(
    encounter,
    "790b41ce-e1e7-11e8-b02f-0242ac130002"
  );

  return [
    {
      event,
      programStage: "sBepdVG2c9O",
      occurredAt: encounter.encounterDatetime.replace("+0000", ""),
      dataValues: [
        {
          dataElement: "Nfd45uVy6lc", // TODO @Aisha not part of sBepdVG2c9O program stage
          value: ["full time", "part time"].some((keyword) =>
            typeOfIncome?.toLowerCase()?.includes(keyword)
          )
            ? "Employment"
            : null,
        },

        {
          dataElement: "Ir0qLWsNv4n", // TODO @Aisha not part of sBepdVG2c9O program stage
          value: ["in the past", "currently"].some((keyword) =>
            usedDrug?.toLowerCase()?.includes(keyword)
          )
            ? "Yes"
            : null,
        },
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
    },
  ];
}

function mapF60(encounter, metadataMap) {
  const { events } = metadataMap;
  const event = events?.find((e) => e.programStage === "sBepdVG2c9O")?.event;
  const typeOfExit = findAnswerByConcept(
    encounter,
    "4f4c6be4-1e1a-4770-a73b-bcc69c171748"
  );

  const typeOfExitOther = findAnswerByConcept(
    encounter,
    "790b41ce-e1e7-11e8-b02f-0242ac130002"
  );
  const dischargeDate = encounter.obs.find(
    (o) => o.concept.uuid === "13cea1c8-e426-411f-95b4-33651fc4325d"
  )?.value;

  return [
    {
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
    },
  ];
}

function mapF61(encounter, metadataMap) {
  const { events } = metadataMap;
  const event = events?.find((e) => e.programStage === "y8MvLYtuKE3")?.event;

  return [
    {
      event,
      programStage: "y8MvLYtuKE3",
      dataValues: [
        {
          dataElement: "wqSAGFM1Oz8",
          value: conceptNotValue(
            encounter,
            "2ff0d1ad-df05-4128-b2d2-d72307a6aa3f"
          ),
        },
        {
          dataElement: "M7aqCkQSnIP",
          value: conceptAndValue(
            encounter,
            "2ff0d1ad-df05-4128-b2d2-d72307a6aa3f",
            "95ac8931-7222-4d14-9d94-2e55074e6261"
          ),
        },
        {
          dataElement: "H6mrPZ2PvGa",
          value: conceptAndValue(
            encounter,
            "2ff0d1ad-df05-4128-b2d2-d72307a6aa3f",
            "a257d08e-b90d-4505-91c3-e23ea040f61c"
          ),
        },
        {
          dataElement: "aHEgOilU4Sg",
          value: conceptAndValue(
            encounter,
            "2ff0d1ad-df05-4128-b2d2-d72307a6aa3f",
            "02e8a7bc-d18c-4650-bf47-c8e52f493f3b"
          ),
        },
        {
          dataElement: "I64ENhlDzP6",
          value: conceptAndValue(
            encounter,
            "2ff0d1ad-df05-4128-b2d2-d72307a6aa3f",
            "a6fe73a2-0352-4104-82a7-4456f1866c1e"
          ),
        },
        {
          dataElement: "i69GqSWXwRZ",
          value: conceptAndValue(
            encounter,
            "2ff0d1ad-df05-4128-b2d2-d72307a6aa3f",
            "9f50dc11-9ed4-4e25-a059-9cb770651c35"
          ),
        },
        {
          dataElement: "KGwTrsJjYR5",
          value: conceptNotValue(
            encounter,
            "ebb50467-1a62-41f0-a849-2ec0ed49607a",
            "ebb50467-1a62-41f0-a849-2ec0ed49607a"
          ),
        },
        {
          dataElement: "G10cJ5RJ2uE",
          value: conceptNotValue(
            encounter,
            "ebb50467-1a62-41f0-a849-2ec0ed49607a",
            "04684645-508f-4ec4-91a9-406e5567a934"
          ),
        },
        {
          dataElement: "Yp6qfnhSbTx",
          value: conceptNotValue(
            encounter,
            "ebb50467-1a62-41f0-a849-2ec0ed49607a",
            "e81a13a6-d469-465d-9c6b-9930c7bb7d39"
          ),
        },
        {
          dataElement: "LgoaYXv2mkO",
          value: conceptNotValue(
            encounter,
            "ebb50467-1a62-41f0-a849-2ec0ed49607a",
            "05aa3b94-7e7e-47f1-80b9-1304889c293c"
          ),
        },
        {
          dataElement: "ScHhUDsY1JM",
          value: conceptNotValue(
            encounter,
            "ebb50467-1a62-41f0-a849-2ec0ed49607a",
            "b10b22e3-a46d-4682-aba5-fdeac3591d29"
          ),
        },
        {
          dataElement: "vKTI1wQhhy7",
          value: conceptNotValue(
            encounter,
            "ebb50467-1a62-41f0-a849-2ec0ed49607a",
            "67322e0a-0def-4543-97cd-89cdd03e2950"
          ),
        },
        {
          dataElement: "qrcrEVE5vOL",
          value: () => {
            const hasConceptId = (conceptId) =>
              encounter.obs.some((o) => o.concept.uuid === conceptId);
            const notValueId = (valueUuid) =>
              encounter.obs.find((o) => o.value.uuid !== valueUuid);
            if (
              hasConceptId("d0e31c9b-fb6b-4d8b-9c54-c8410c719f1c") &&
              notValueId("1eff97cc-bec8-4bdf-9022-dc0f2132c260")
            ) {
              return "By road";
            }
            if (
              hasConceptId("d0e31c9b-fb6b-4d8b-9c54-c8410c719f1c") &&
              notValueId("8c5d6c46-1712-483f-91db-c6a9db213c50")
            ) {
              return "By plane";
            }
            if (
              hasConceptId("d0e31c9b-fb6b-4d8b-9c54-c8410c719f1c") &&
              notValueId("1eff97cc-bec8-4bdf-9022-dc0f2132c260") &&
              notValueId("a31cd4a6-a02b-490b-b913-59cbc8f305f8")
            ) {
              return "By road and boat";
            }

            if (
              hasConceptId("d0e31c9b-fb6b-4d8b-9c54-c8410c719f1c") &&
              notValueId("1eff97cc-bec8-4bdf-9022-dc0f2132c260") &&
              notValueId("8c5d6c46-1712-483f-91db-c6a9db213c50")
            ) {
              return "By road and plane";
            }

            if (
              hasConceptId("d0e31c9b-fb6b-4d8b-9c54-c8410c719f1c") &&
              notValueId("b10b22e3-a46d-4682-aba5-fdeac3591d29") &&
              notValueId("8c5d6c46-1712-483f-91db-c6a9db213c50")
            ) {
              return "By boat and plane";
            }

            if (
              hasConceptId("d0e31c9b-fb6b-4d8b-9c54-c8410c719f1c") &&
              notValueId("1eff97cc-bec8-4bdf-9022-dc0f2132c260") &&
              notValueId("a31cd4a6-a02b-490b-b913-59cbc8f305f8") &&
              notValueId("8c5d6c46-1712-483f-91db-c6a9db213c50")
            ) {
              return "By road, boat and plane";
            }
            if (
              hasConceptId("d30db8b8-f8fb-450c-9562-629195212a45") &&
              notValueId("a6fe73a2-0352-4104-82a7-4456f1866c1e")
            ) {
              return true;
            }
          },
        },
        {
          dataElement: "gJoiya16c1E",
          value: conceptNotValue(
            encounter,
            "d30db8b8-f8fb-450c-9562-629195212a45",
            "a6fe73a2-0352-4104-82a7-4456f1866c1e"
          ),
        },
        {
          dataElement: "aHEgOilU4Sg",
          value: conceptNotValue(
            encounter,
            "d30db8b8-f8fb-450c-9562-629195212a45",
            "02e8a7bc-d18c-4650-bf47-c8e52f493f3b"
          ),
        },
        {
          dataElement: "ahGVTDSbSaq",
          value: conceptNotValue(
            encounter,
            "d30db8b8-f8fb-450c-9562-629195212a45",
            "a257d08e-b90d-4505-91c3-e23ea040f61c"
          ),
        },
        {
          dataElement: "i69GqSWXwRZ",
          value: conceptNotValue(
            encounter,
            "d30db8b8-f8fb-450c-9562-629195212a45",
            "9f50dc11-9ed4-4e25-a059-9cb770651c35"
          ),
        },
        {
          dataElement: "Sp0VsyyvDCI",
          value: conceptNotValue(
            "96d32363-694a-4d6a-9710-6ceadd0e2894",
            "4a946686-7d67-40d5-b1f1-a0aad133193c"
          ),
        },
        {
          dataElement: "JNNfaYcPPuS",
          value: conceptNotValue(
            "96d32363-694a-4d6a-9710-6ceadd0e2894",
            "9de0f8c5-df5c-4fc2-a586-48acd7219e04"
          ),
        },
        {
          dataElement: "awIYcHfNEnI",
          value: conceptNotValue(
            encounter,
            "96d32363-694a-4d6a-9710-6ceadd0e2894",
            "0254978b-c858-4b9d-ba66-074ced37a6d5"
          ),
        },
        {
          dataElement: "xjG5N6RD9vm",
          value: conceptNotValue(
            encounter,
            "96d32363-694a-4d6a-9710-6ceadd0e2894",
            "e48a7343-bbc1-4e83-85ab-87e267f15cec"
          ),
        },
        {
          dataElement: "Lj15WiOE5Jj",
          value: conceptNotValue(
            encounter,
            "96d32363-694a-4d6a-9710-6ceadd0e2894",
            "2b616aa9-e573-40a1-8e01-dfdde229553b"
          ),
        },
      ].filter((d) => d.value),
    },
  ];
}

function mapF62(encounter, metadataMap) {
  const { events } = metadataMap;

  const hospitalisationEvent = {
    event: events?.find((e) => e.programStage === "YivvTlIw5Ep")?.event,
    programStage: "YivvTlIw5Ep",
    dataValues: [
      {
        dataElement: "d3BwrZYHAbK",
        value: encounter.encounterDatetime
          .replace("+0000", "")
          .substring(11, 19),
      },
      {
        dataElement: "RSQqK2yZGz6",
        value: findAnswerByConcept(
          encounter,
          "c149755e-dd32-43b0-b643-ab14aa483207"
        ),
      },
      {
        dataElement: "NHBJjpIXPBI",
        value: findAnswerByConcept(
          encounter,
          "b996944c-b136-4e8e-9068-562476a0595a"
        ),
      },
      {
        dataElement: "LPIyv58pWVg",
        value: findAnswerByConcept(
          encounter,
          "13cea1c8-e426-411f-95b4-33651fc4325d"
        ),
      },
      {
        dataElement: "nrqutHXxAUk",
        value: findAnswerByConcept(
          encounter,
          "09a06404-afc5-457a-91b9-54152e45a854"
        ),
      },
      {
        dataElement: "dNJ9ZJ4zaJw",
        value: conceptNotValue(
          encounter,
          "6b3cf530-e574-419a-9dd4-2c8d3ad69562",
          "895813df-fbec-4164-9375-eed588ff0387"
        ),
      },
      {
        dataElement: "KlAcesRNOlU",
        value: conceptNotValue(
          encounter,
          "6b3cf530-e574-419a-9dd4-2c8d3ad69562",
          "bfcf416f-8aa1-4b9d-a0f7-77c142c1df67"
        ),
      },
      {
        dataElement: "pP8Bb7H0arh",
        value: conceptNotValue(
          encounter,
          "6b3cf530-e574-419a-9dd4-2c8d3ad69562",
          "10156771-379a-4eb1-af43-39b418adba4a"
        ),
      },
      {
        dataElement: "fKmCFuaV2wo",
        value: conceptNotValue(
          encounter,
          "6b3cf530-e574-419a-9dd4-2c8d3ad69562",
          "14e79fdc-4250-428f-949e-dabb2cef4315"
        ),
      },
      {
        dataElement: "oOa893M9qnL",
        value: conceptNotValue(
          encounter,
          "6b3cf530-e574-419a-9dd4-2c8d3ad69562",
          "a39e540e-b988-40e8-a8b2-26b831c179ef"
        ),
      },
      {
        dataElement: "rDJiUSUtmrg",
        value: conceptNotValue(
          encounter,
          "6b3cf530-e574-419a-9dd4-2c8d3ad69562",
          "c884bf19-6791-4c38-af6b-1ad910191a89"
        ),
      },
      {
        dataElement: "PG9mocTexDK",
        value: conceptNotValue(
          encounter,
          "6b3cf530-e574-419a-9dd4-2c8d3ad69562",
          "d592dcaf-ae83-4acc-921e-127aa27545b5"
        )
          ? "Dressing"
          : null,
      },
    ],
  };

  const exitEvent = {
    event: events?.find((e) => e.programStage === "Otoff7Cj8JQ")?.event,
    programStage: "Otoff7Cj8JQ",
    dataValues: [
      {
        dataElement: "iGsz0Q3b0HC",
        value: findAnswerByConcept(
          encounter,
          "1f473371-613f-4ef3-b297-49eb779ccd27"
        ),
      },
      {
        dataElement: "mpiPBwCu6Xa",
        value: findAnswerByConcept(
          encounter,
          "9e861ef1-e07c-4955-9650-2ebac3138fc3"
        ),
      },
      {
        dataElement: "d8eoys0WPgR",
        value: findAnswerByConcept(
          encounter,
          "a844ff25-b3fb-4873-9681-f2f35f5159ec"
        ),
      },
      {
        dataElement: "p1t7OpwVBcl",
        value: findAnswerByConcept(
          encounter,
          "778b70b5-c6de-4459-a101-6bf02f77d5c7"
        ),
      },
    ],
  };
  const f62Events = [hospitalisationEvent, exitEvent];

  return f62Events;
}

function mapF63(encounter, metadataMap) {
  return mapF62(encounter, metadataMap); // TODO @Aisha to confirm with ludovic
}

const findDataValue = (encounter, dataElement, metadataMap) => {
  const { optsMap, optionSetKey, form } = metadataMap;
  const [conceptUuid, questionId] =
    form.dataValueMap[dataElement]?.split("-rfe-") || [];
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

    const opt = optsMap.find(
      (o) =>
        o["value.uuid - External ID"] === answer.value.uuid &&
        o["DHIS2 Option Set UID"] === matchingOptionSet
    );

    // console.log("<-");
    // console.log("optionKey", optionKey);
    // console.log("matchingOptionSet:", matchingOptionSet);
    // console.log("Answer Uuid:", answer.value.uuid);
    // console.log("Answer Display Value:", answer.value.display);
    // console.log("Opt:", opt);
    // console.log("->");

    const matchingOption =
      opt?.["DHIS2 Option Code"] ||
      opt?.["DHIS2 Option name"] || // TODO: Sync with AK: We have added this because  Opticon Code is empty in some cases.
      answer?.value?.display; //TODO: revisit this logic if optionSet not found
    if (!opt) {
      console.log(
        `No opt found for External id ${answer.value.uuid} and DHIS2 OptionSet ${matchingOptionSet}`
      );
    }
    if (matchingOption !== opt?.["DHIS2 Option Code"]) {
      console.log(
        `No DHIS2 Option Code found for External id ${answer.value.uuid} and DHIS2 OptionSet ${matchingOptionSet}`
      );
    }

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

const buildExitEvent = (encounter, tei, metadataMap) => {
  const { program, orgUnit, trackedEntity, enrollment, events } = tei;
  const { formMaps, dhis2Map, optionSetKey, optsMap } = metadataMap;

  let exitEvents = [];
  const sharedEventMap = {
    program,
    orgUnit,
    trackedEntity,
    enrollment,
    occurredAt: encounter.encounterDatetime.replace("+0000", ""),
  };

  if (encounter.form.description.includes("F49-NCDs Baseline")) {
    const programStage = formMaps[encounter.form.uuid].programStage;
    const metadataMap = {
      events,
      programStage,
      dhis2Map,
      optionSetKey,
      optsMap,
    };
    const eventsMap = mapF49(encounter, metadataMap);
    for (const event of eventsMap) {
      exitEvents.push({ ...sharedEventMap, ...event });
    }
  }
  if (encounter.form.description.includes("F55-HBV Baseline")) {
    const programStage = formMaps[encounter.form.uuid].programStage;
    const metadataMap = { events, programStage, dhis2Map };
    const eventsMap = mapF55(encounter, metadataMap);
    for (const event of eventsMap) {
      exitEvents.push({ ...sharedEventMap, ...event });
    }
  }
  if (encounter.form.description.includes("F56-HBV Follow-up")) {
    const eventsMap = mapF56(encounter, { events });
    for (const event of eventsMap) {
      exitEvents.push({ ...sharedEventMap, ...event });
    }
  }
  if (encounter.form.description.includes("F58-HCV Follow-up")) {
    const eventsMap = mapF58(encounter, { events });
    for (const event of eventsMap) {
      exitEvents.push({ ...sharedEventMap, ...event });
    }
  }
  if (encounter.form.description.includes("F59-Social Work Baseline")) {
    const eventsMap = mapF59(encounter, { events });
    for (const event of eventsMap) {
      exitEvents.push({ ...sharedEventMap, ...event });
    }
  }
  if (encounter.form.description.includes("F60-Social Work Follow-up")) {
    const eventsMap = mapF60(encounter, { events });
    for (const event of eventsMap) {
      exitEvents.push({ ...sharedEventMap, ...event });
    }
  }
  if (encounter.form.description.includes("F61-Travel medicine")) {
    const eventsMap = mapF61(encounter, { events });
    for (const event of eventsMap) {
      exitEvents.push({ ...sharedEventMap, ...event });
    }
  }
  if (encounter.form.description.includes("F62-Palliative care Baseline")) {
    const eventsMap = mapF62(encounter, { events });
    for (const event of eventsMap) {
      exitEvents.push({ ...sharedEventMap, ...event });
    }
  }
  if (encounter.form.description.includes("F63-Palliative care Follow-up")) {
    const eventsMap = mapF63(encounter, { events });
    for (const event of eventsMap) {
      exitEvents.push({ ...sharedEventMap, ...event });
    }
  }

  return exitEvents;
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
      const { trackedEntity, enrollment, events } =
        state.childTeis[patientOuProgram] || {};

      if (!trackedEntity || !enrollment) {
        console.log(
          `❌ Missing TEI data for patient ${encounter.patient.uuid}`
        );

        handleMissingRecord(encounter, state);
        return null;
      }
      console.log(`✅ Processing encounter ${index} successfully`);

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

      const customMapping = [
        mapF11(encounter, state.optsMap),
        mapF13(encounter, state.optsMap),
        mapF18(encounter, state.encounters),
        mapF16(encounter),
        mapF17(encounter),
        mapF29(encounter, state.optsMap),
        mapF22(encounter),
        mapF37(encounter),
        mapF38(encounter),
        mapF30F29(encounter, state.allEncounters),
        mapF32F31(encounter, state.allEncounters),
        mapF33F34(encounter, state.allEncounters),
      ]
        .filter(Boolean) // Only include non-empty mappings
        .flat(); // flattening the array

      const formEvent = {
        event: events?.find((e) => e.programStage === form.programStage)?.event,
        program,
        orgUnit,
        trackedEntity,
        enrollment,
        occurredAt: encounter.encounterDatetime.replace("+0000", ""),
        programStage: form.programStage,
        dataValues: [...formDataValues, ...customMapping].filter(
          (d) => d?.value
        ),
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
        {
          formMaps: state.formMaps,
          dhis2Map: state.dhis2Map,
          optionSetKey: state.optionSetKey,
          optsMap: state.optsMap,
        }
      );

      const mappings = [formEvent, ...exitFormEvents];

      return mappings;
    })
    .flat()
    .filter(Boolean);
  console.log("Final eventsMapping length:", state.eventsMapping.length);

  return state;
  return {
    dhis2Map: state.dhis2Map,
    eventsMapping: state.eventsMapping,
    encounters: state.encounters,
    // optionSetKey: state.optionSetKey,
    // optsMap: state.optsMap,
    // formMaps: state.formMaps,
  };
});
