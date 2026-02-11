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

const conceptAndValueTrueOnly = (encounter, conceptUuid, valueUuid) => {
  const answer = encounter.obs.find(
    (o) => o.concept.uuid === conceptUuid && o.value.uuid === valueUuid
  );
  return answer ? "TRUE" : undefined;
};

function mapF11(encounter, optsMap) {
  if (encounter.form.name.includes("F11-Family Planning Assessment")) {
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
  if (encounter.form.name.includes("F29-MHPSS Baseline v2")) {
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
  if (encounter.form.name.includes("F30-MHPSS Follow-up v2")) {
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
  if (encounter.form.name.includes("F32-mhGAP Follow-up v2")) {
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
    encounter.form.name.includes("F33-MHPSS Closure v2") ||
    encounter.form.name.includes("F34-mhGAP Closure v2")
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

  return [
    ...f37Mapping,
    {
      dataElement: "O7HyhSTFrA0",
      value: encounter.encounterDatetime.split("T")[0],
    },
  ];
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

  // ✅ IMPROVED: Multi-select with type indicator
  multiSelect: {
    observedComplications: {
      concept: "ec9ffc6e-22c9-4489-ab88-c517460e7838",
      qid: "rfe-forms-observedComplication",
      dataElements: [
        "Ff5TAZQB2Gx",
        "jy6y43zcjIF",
        "nroQVwfad5s",
        "zzlWrNP7L9F",
      ],
      type: "coded", // ✅ Needs dataValueByConcept
    },
    medications: {
      concept: "ae1e4603-7ab4-4ed1-902e-eee33a9c5eef",
      qid: "rfe-forms-medication",
      dataElements: [
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
      type: "coded", // ✅ Needs dataValueByConcept
    },
    specialistTypes: {
      concept: "8fb3bb7d-c935-4b57-8444-1b953470e109",
      qid: "rfe-forms-referralSpecialistType",
      dataElements: ["Atg3aAfVv2V", "a35jmcOCCwc", "eurWUL2l6Gw"],
      type: "coded", // ✅ Needs dataValueByConcept
    },
    ifOtherSpecialistTypes: {
      concept: "790b41ce-e1e7-11e8-b02f-0242ac130002",
      qid: "rfe-forms-specialistIfOtherPleaseSpecify",
      dataElements: ["iXRsVYYypkU", "xnpdL9cgpDH", "NYEmxR8LW75"],
      type: "text", // ✅ Plain text values (no option set mapping needed)
    },
  },

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

function mapMultiSelect(encounter, config, state) {
  const { concept, qid, dataElements, type } = config;
  // Get all observations for this multi-select field
  const observations = filterObsByConcept(encounter, `${concept}-${qid}`);

  // Map each observation to its data element
  return observations
    .slice(0, dataElements.length)
    .map((obs, index) => {
      const de = dataElements[index];

      let value;

      if (type === "coded") {
        // ✅ Use dataValueByConcept for coded values (proper option set mapping)
        // Create a temporary encounter with just this observation to get the value
        value = dataValueByConcept(
          { ...encounter, obs: [obs] }, // Pass single obs
          {
            dataElement: de,
            conceptUuid: concept,
            questionId: qid,
          },
          state
        );
      } else if (type === "text") {
        // ✅ For text values, use the value directly
        value = obs.value;
      } else {
        console.warn(`Unknown multi-select type: ${type}`);
        value = obs.value?.display || obs.value;
      }

      return {
        dataElement: de,
        value: value,
      };
    })
    .filter((dv) => dv && dv.value); // Filter out null/undefined values
}

function mapF49(encounter, events, state) {
  const { dhis2Map } = state;
  const programStage = state.formMaps[encounter.form.uuid]?.programStage;
  const dataEl = dhis2Map.de;

  const defaultEvent = events?.find(
    (e) => e.programStage === programStage
  )?.event;
  const pregnancyEvent = events?.find(
    (e) => e.programStage === F49_CONFIG.pregnancyStage.programStage
  )?.event;
  const investigationEvent = events?.find(
    (e) => e.programStage === F49_CONFIG.investigationStage.programStage
  )?.event;

  // DEFAULT STAGE
  const defaultDataValues = [];

  // 1. Consultation date
  const consultationDate = encounter.obs.find(
    (o) => o.concept.uuid === "d329cd4b-a10f-4a4d-96b5-c907bf87e721"
  )?.value;

  if (consultationDate) {
    defaultDataValues.push({
      dataElement: dataEl.f49.ncdEventDate,
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

  // 4-7. Multi-select fields
  // Observed Complications
  defaultDataValues.push(
    ...mapMultiSelect(
      encounter,
      F49_CONFIG.multiSelect.observedComplications,
      state
    )
  );

  // Medications
  defaultDataValues.push(
    ...mapMultiSelect(encounter, F49_CONFIG.multiSelect.medications, state)
  );

  // Specialist Types
  defaultDataValues.push(
    ...mapMultiSelect(encounter, F49_CONFIG.multiSelect.specialistTypes, state)
  );

  // If Other Specialist Types (text values)
  defaultDataValues.push(
    ...mapMultiSelect(
      encounter,
      F49_CONFIG.multiSelect.ifOtherSpecialistTypes,
      state
    )
  );

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

  multiSelect: {
    observedComplications: {
      concept: "ec9ffc6e-22c9-4489-ab88-c517460e7838",
      qid: "rfe-forms-observedComplication",
      dataElements: [
        "as6ICto55cO",
        "y8TsEYlp5ai",
        "U4N9k9q8iM8",
        "M3rXGXDLVjx",
      ],
      type: "coded",
    },
    medications: {
      concept: "ae1e4603-7ab4-4ed1-902e-eee33a9c5eef",
      qid: "rfe-forms-medicationPrescribedInCurrentConsultation",
      dataElements: [
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
      type: "coded",
    },
    specialistTypes: {
      concept: "8fb3bb7d-c935-4b57-8444-1b953470e109",
      qid: "rfe-forms-referralSpecialistType",
      dataElements: ["TsG88CXqaii", "GeqxZYGIjPC", "QThCIIp4FRC"],
      type: "coded",
    },
    ifOtherSpecialistTypes: {
      concept: "790b41ce-e1e7-11e8-b02f-0242ac130002",
      qid: "rfe-forms-specialistIfOtherPleaseSpecify",
      dataElements: ["u68lzJcSaBa", "PO19ZbOBOO1", "OdrZUtuEaUU"],
      type: "text",
    },
  },

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
  const programStage = state.formMaps[encounter.form.uuid]?.programStage;
  const dataEl = dhis2Map.de;

  const defaultEvent = events?.find(
    (e) => e.programStage === programStage
  )?.event;

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

  // 3. Multi-select fields
  // Observed Complications
  defaultDataValues.push(
    ...mapMultiSelect(
      encounter,
      F50_CONFIG.multiSelect.observedComplications,
      state
    )
  );

  // Medications
  defaultDataValues.push(
    ...mapMultiSelect(encounter, F50_CONFIG.multiSelect.medications, state)
  );

  // Specialist Types
  defaultDataValues.push(
    ...mapMultiSelect(encounter, F50_CONFIG.multiSelect.specialistTypes, state)
  );

  // If Other Specialist Types (text values)
  defaultDataValues.push(
    ...mapMultiSelect(
      encounter,
      F50_CONFIG.multiSelect.ifOtherSpecialistTypes,
      state
    )
  );

  // PREGNANCY STAGE
  const pregnancyEvent = events?.find(
    (e) => e.programStage === F50_CONFIG.pregnancyStage.programStage
  )?.event;
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
  const investigationEvent = events?.find(
    (e) => e.programStage === F50_CONFIG.investigationStage.programStage
  )?.event;
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
  const defaultProgramStage = state.formMaps[encounter.form.uuid]?.programStage;

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
    event: events?.find((e) => e.programStage === defaultProgramStage)?.event,
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
  const event = events?.find((e) => e.programStage === "sBepdVG2c9O")?.event;

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
      conceptUuid: "790b41ce-e1e7-11e8-b02f-0242ac130002",
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
  const event = events?.find((e) => e.programStage === "sBepdVG2c9O")?.event;
  const defaultProgramStage = state.formMaps[encounter.form.uuid]?.programStage;

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
      conceptUuid: "790b41ce-e1e7-11e8-b02f-0242ac130002",
      questionId: "rfe-forms-typeOfExitIfOtherSpecify",
    },
    state
  );

  const defaultEvent = {
    event: events?.find((e) => e.programStage === defaultProgramStage)?.event,
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
    // Boolean data elements from multi-select concept
    booleanMappings: [
      { de: "dNJ9ZJ4zaJw", answer: "895813df-fbec-4164-9375-eed588ff0387" }, // Physiotherapy
      { de: "KlAcesRNOlU", answer: "bfcf416f-8aa1-4b9d-a0f7-77c142c1df67" }, // Psychosocial counseling
      { de: "pP8Bb7H0arh", answer: "10156771-379a-4eb1-af43-39b418adba4a" }, // Spiritual support
      { de: "fKmCFuaV2wo", answer: "14e79fdc-4250-428f-949e-dabb2cef4315" }, // Mental health support
      { de: "oOa893M9qnL", answer: "a39e540e-b988-40e8-a8b2-26b831c179ef" }, // Catheterization
      { de: "rDJiUSUtmrg", answer: "c884bf19-6791-4c38-af6b-1ad910191a89" }, // N/g tube feeding
    ],
    // Special nursing care mapping (TEXT type, stays in default stage)
    nursingCare: {
      de: "PG9mocTexDK",
      dressingAnswer: "d592dcaf-ae83-4acc-921e-127aa27545b5", // Dressing
    },
  },

  // Hospitalisation stage
  hospitalisationStage: {
    programStage: "YivvTlIw5Ep",
    timeDataElement: "d3BwrZYHAbK",
    simpleValues: [
      { de: "RSQqK2yZGz6", concept: "c149755e-dd32-43b0-b643-ab14aa483207" }, // Admission to ward
      { de: "NHBJjpIXPBI", concept: "b996944c-b136-4e8e-9068-562476a0595a" }, // Reason of hospitalisation
      { de: "LPIyv58pWVg", concept: "13cea1c8-e426-411f-95b4-33651fc4325d" }, // Date of discharge
      { de: "nrqutHXxAUk", concept: "09a06404-afc5-457a-91b9-54152e45a854" }, // Type of discharge
    ],
  },

  // Exit stage
  exitStage: {
    programStage: "Otoff7Cj8JQ",
    simpleValues: [
      { de: "iGsz0Q3b0HC", concept: "1f473371-613f-4ef3-b297-49eb779ccd27" }, // Date of Exit
      { de: "mpiPBwCu6Xa", concept: "9e861ef1-e07c-4955-9650-2ebac3138fc3" }, // Outcome
      { de: "d8eoys0WPgR", concept: "a844ff25-b3fb-4873-9681-f2f35f5159ec" }, // Reason for discharge
      { de: "p1t7OpwVBcl", concept: "778b70b5-c6de-4459-a101-6bf02f77d5c7" }, // Death cause
    ],
  },
};

function mapF62(encounter, events) {
  const defaultProgramStage = state.formMaps[encounter.form.uuid]?.programStage;

  // DEFAULT STAGE - Other Support
  const defaultDataValues = [];

  // Map multi-select boolean values
  F62_CONFIG.defaultStage.booleanMappings.forEach((mapping) => {
    const value = conceptAndValueTrueOnly(
      encounter,
      F62_CONFIG.defaultStage.concept,
      mapping.answer
    );
    if (value) {
      defaultDataValues.push({
        dataElement: mapping.de,
        value,
      });
    }
  });

  // Add nursing care special logic (stays in default stage)
  const dressingValue = conceptAndValueTrueOnly(
    encounter,
    F62_CONFIG.defaultStage.concept,
    F62_CONFIG.defaultStage.nursingCare.dressingAnswer
  );
  if (dressingValue) {
    defaultDataValues.push({
      dataElement: F62_CONFIG.defaultStage.nursingCare.de,
      value: "Dressing",
    });
  }

  const defaultEvent = {
    event: events?.find((e) => e.programStage === defaultProgramStage)?.event,
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
    const value = findAnswerByConcept(encounter, mapping.concept);
    if (value) {
      hospitalisationDataValues.push({
        dataElement: mapping.de,
        value,
      });
    }
  });

  const hospitalisationEvent = {
    event: events?.find(
      (e) => e.programStage === F62_CONFIG.hospitalisationStage.programStage
    )?.event,
    programStage: F62_CONFIG.hospitalisationStage.programStage,
    dataValues: hospitalisationDataValues,
  };

  // EXIT STAGE
  const exitDataValues = [];

  F62_CONFIG.exitStage.simpleValues.forEach((mapping) => {
    const value = findAnswerByConcept(encounter, mapping.concept);
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
    // Boolean data elements from multi-select concept (DIFFERENT UIDs from F62)
    booleanMappings: [
      { de: "xYKYFOhYU8H", answer: "895813df-fbec-4164-9375-eed588ff0387" }, // Physiotherapy
      { de: "ZiUJxGceREv", answer: "bfcf416f-8aa1-4b9d-a0f7-77c142c1df67" }, // Psychosocial counseling
      { de: "cx6nwmLSmR7", answer: "10156771-379a-4eb1-af43-39b418adba4a" }, // Spiritual support
      { de: "eyg7Rh69ScO", answer: "14e79fdc-4250-428f-949e-dabb2cef4315" }, // Mental health support
      { de: "zPtuGGASJZ0", answer: "a39e540e-b988-40e8-a8b2-26b831c179ef" }, // Catheterization
      { de: "PzwXcfb3s6h", answer: "c884bf19-6791-4c38-af6b-1ad910191a89" }, // N/g tube feeding
    ],
    // Special nursing care mapping (TEXT type, stays in default stage, DIFFERENT UID from F62)
    nursingCare: {
      de: "LIlfhZdkMpB",
      dressingAnswer: "d592dcaf-ae83-4acc-921e-127aa27545b5", // Dressing
    },
  },

  // Hospitalisation stage (SAME as F62)
  hospitalisationStage: {
    programStage: "YivvTlIw5Ep",
    timeDataElement: "d3BwrZYHAbK",
    simpleValues: [
      { de: "RSQqK2yZGz6", concept: "c149755e-dd32-43b0-b643-ab14aa483207" }, // Admission to ward
      { de: "NHBJjpIXPBI", concept: "b996944c-b136-4e8e-9068-562476a0595a" }, // Reason of hospitalisation
      { de: "LPIyv58pWVg", concept: "13cea1c8-e426-411f-95b4-33651fc4325d" }, // Date of discharge
      { de: "nrqutHXxAUk", concept: "09a06404-afc5-457a-91b9-54152e45a854" }, // Type of discharge
    ],
  },

  // Exit stage (SAME as F62)
  exitStage: {
    programStage: "Otoff7Cj8JQ",
    simpleValues: [
      { de: "iGsz0Q3b0HC", concept: "1f473371-613f-4ef3-b297-49eb779ccd27" }, // Date of Exit
      { de: "mpiPBwCu6Xa", concept: "9e861ef1-e07c-4955-9650-2ebac3138fc3" }, // Outcome
      { de: "d8eoys0WPgR", concept: "a844ff25-b3fb-4873-9681-f2f35f5159ec" }, // Reason for discharge
      { de: "p1t7OpwVBcl", concept: "778b70b5-c6de-4459-a101-6bf02f77d5c7" }, // Death cause
    ],
  },
};

function mapF63(encounter, events) {
  const defaultProgramStage = state.formMaps[encounter.form.uuid]?.programStage;

  // DEFAULT STAGE - Other Support
  const defaultDataValues = [];

  // Map multi-select boolean values
  F63_CONFIG.defaultStage.booleanMappings.forEach((mapping) => {
    const value = conceptAndValueTrueOnly(
      encounter,
      F63_CONFIG.defaultStage.concept,
      mapping.answer
    );
    if (value) {
      defaultDataValues.push({
        dataElement: mapping.de,
        value,
      });
    }
  });

  // Add nursing care special logic (stays in default stage)
  const dressingValue = conceptAndValueTrueOnly(
    encounter,
    F63_CONFIG.defaultStage.concept,
    F63_CONFIG.defaultStage.nursingCare.dressingAnswer
  );
  if (dressingValue) {
    defaultDataValues.push({
      dataElement: F63_CONFIG.defaultStage.nursingCare.de,
      value: "Dressing",
    });
  }

  const defaultEvent = {
    event: events?.find((e) => e.programStage === defaultProgramStage)?.event,
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
    const value = findAnswerByConcept(encounter, mapping.concept);
    if (value) {
      hospitalisationDataValues.push({
        dataElement: mapping.de,
        value,
      });
    }
  });

  const hospitalisationEvent = {
    event: events?.find(
      (e) => e.programStage === F63_CONFIG.hospitalisationStage.programStage
    )?.event,
    programStage: F63_CONFIG.hospitalisationStage.programStage,
    dataValues: hospitalisationDataValues,
  };

  // EXIT STAGE
  const exitDataValues = [];

  F63_CONFIG.exitStage.simpleValues.forEach((mapping) => {
    const value = findAnswerByConcept(encounter, mapping.concept);
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

const dataValueByConcept = (encounter, de, state) => {
  const { dataElement, conceptUuid, questionId } = de;

  const answer = encounter.obs.find((o) => o.concept.uuid === conceptUuid);
  const isObjectAnswer = answer && typeof answer.value === "object";
  const isStringAnswer = answer && typeof answer.value === "string";
  const isNumberAnswer = answer && typeof answer.value === "number";

  if (isStringAnswer || isNumberAnswer) {
    return answer.value;
  }

  if (isObjectAnswer) {
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
  const [conceptUuid, questionId] =
    form.dataValueMap[dataElement]?.split("-rfe-") || [];
  const answer = encounter.obs.find((o) => o.concept.uuid === conceptUuid);
  const isObjectAnswer = answer && typeof answer.value === "object";
  const isStringAnswer = answer && typeof answer.value === "string";
  const isNumberAnswer = answer && typeof answer.value === "number";

  if (dataElement === "gn40F7cEQTI") {
    console.log(form.dataValueMap[dataElement]);
    console.log({ dataElement, answer, conceptUuid, questionId });
  }
  if (isStringAnswer || isNumberAnswer) {
    return answer.value;
  }

  if (isObjectAnswer) {
    const optionKey = questionId
      ? `${encounter.form.uuid}-${answer.concept.uuid}-rfe-${questionId}`
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
  // F29 MHPSS Baseline v2, F31-mhGAP Baseline v2, F30-MHPSS Follow-up v2, F32-mhGAp Follow-up v2
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
  // const { formMaps, dhis2Map, optionSetKey, optsMap } = metadataMap;

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
  state.eventsMapping = mergeEvents(state.eventsMapping);
  return state;
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
