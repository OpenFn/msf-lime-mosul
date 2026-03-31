// F64-specific age attributes
const f64AgeInYearsAttr = "Rv8WM2mTuS5"; //dhis2Map.attr.ageInYears
const f64AgeInMonthsAttr = "k26cdlS78i9";

const MILLISECONDS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
const calculateAge = (dob) =>
  Math.floor((new Date() - new Date(dob)) / MILLISECONDS_PER_YEAR);

const teiAge = (tei, attr) => {
  const { ageInYears, birthdate } = attr;
  let age = tei?.attributes?.find(
    (attr) => attr.attribute === ageInYears
  )?.value;

  if (!age) {
    const dob = tei?.attributes?.find(
      (attr) => attr.attribute === birthdate
    )?.value;
    age = calculateAge(dob);
  }
  return age;
};

const formIdByName = (name, formMaps) => {
  const entry = Object.entries(formMaps).find(([formId, form]) =>
    form.formName.includes(name)
  );
  return entry ? entry[0] : null;
};

const ageInDays = (dob, encounterDate) => {
  const birth = new Date(dob);
  const encounter = new Date(encounterDate);
  const diffTime = Math.abs(encounter - birth);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const conceptAndValue = (encounter, conceptUuid, valueUuid) => {
  const answer = encounter.obs.find(
    (o) => o.concept.uuid === conceptUuid && o.value.uuid === valueUuid
  );
  return answer ? "true" : "false";
};
const conceptAndValueTrueOnly = (encounter, conceptUuid, valueUuid) => {
  const answer = encounter.obs.find(
    (o) => o.concept.uuid === conceptUuid && o.value.uuid === valueUuid
  );
  return answer ? "true" : undefined;
};

const dataValueByConcept = (encounter, de, state) => {
  const { dataElement, conceptUuid, questionId, type } = de;

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
    if (type === "true_only" && answer.value.display.toLowerCase() === "yes") {
      return "true";
    }
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

    if (matchingOption && type === "boolean") {
      if (["false", "no"].includes(matchingOption.toLowerCase()))
        return "false";
      if (["true", "yes"].includes(matchingOption.toLowerCase())) return "true";
    }

    return matchingOption;
  }
};

const findObsByConcept = (encounter, conceptUuid, questionId) => {
  const answer = encounter.obs.find(
    (o) =>
      o.concept.uuid === conceptUuid &&
      (questionId ? o.formFieldPath === questionId : true)
  );

  return answer;
};

const filterObsByConcept = (encounter, conceptUuid, questionId) => {
  const answers = encounter.obs.filter(
    (o) =>
      o.concept.uuid === conceptUuid &&
      (questionId ? o.formFieldPath === questionId : true)
  );
  return answers;
};

const toTrueOrFalse = (value) => {
  if (["true", "yes", "positive"].includes(value?.toLowerCase())) {
    return "true";
  }
  if (["false", "no", "negative"].includes(value?.toLowerCase())) {
    return "false";
  }
  return value;
};
const findDataValue = (encounter, dataElement, state) => {
  if (dataElement === "H9noxo3e7ox") {
    return;
  }
  const form = state.formMaps[encounter.form.uuid];
  const [conceptUuid, type, questionId] =
    form.dataValueMap[dataElement]?.split("::");
  const answer = encounter.obs.find(
    (o) =>
      o.concept.uuid === conceptUuid &&
      (o.formFieldPath === questionId || !questionId)
  );
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
    if (type === "true_only" && answer.value.display.toLowerCase() === "yes") {
      return "true";
    }
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

    if (matchingOption && type === "boolean") {
      if (["false", "no"].includes(matchingOption.toLowerCase()))
        return "false";
      if (["true", "yes"].includes(matchingOption.toLowerCase())) return "true";
    }

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
function f8(encounter) {
  const timePart = encounter.encounterDatetime.substring(11, 16);
  return {
    dataValues: [{ dataElement: "iQio7NYSA3m", value: timePart }],
    eventDate: encounter.encounterDatetime.replace("+0000", ""),
  };
}

function f26(encounter, state) {
  const config = {
    concept: "8afa4dfc-b2af-452c-b402-4b96b0f334b4",
    qid: "rfe-forms-antimalariaType",
    dataElements: ["GUiSgvbwUyc", "F6C5WnGoj5r"],
  };
  const antimalariaType = filterObsByConcept(
    encounter,
    config.concept,
    config.qid
  );

  return antimalariaType.slice(0, 2).map((obs, index) => {
    const de = config.dataElements[index];

    const value = dataValueByConcept(
      { ...encounter, obs: [obs] }, // Pass single obs
      {
        dataElement: de,
        conceptUuid: config.concept,
        questionId: config.qid,
      },
      state
    );
    return {
      dataElement: de,
      value: value,
    };
  });
}

function f27(encounter) {
  const admissionDate = findObsByConcept(
    encounter,
    "7f00c65d-de60-467a-8964-fe80c7a85ef0"
  )?.value;
  if (!admissionDate) return { dataValues: [], eventDate: null };
  const timePart = admissionDate.substring(11, 16);
  const datePart = admissionDate.replace("+0000", "");
  return {
    dataValues: [{ dataElement: "eYvDzr2m8f5", value: timePart }],
    eventDate: datePart,
  };
}

function f41(encounter) {
  const obsDatetime = findObsByConcept(
    encounter,
    "40108bf5-0bbd-42e8-8102-bcbd0550a943"
  )?.value;
  if (!obsDatetime) return { dataValues: [], eventDate: null };

  const timePart = obsDatetime.substring(11, 16);
  const datePart = obsDatetime.replace("+0000", "");

  return {
    dataValues: [
      { dataElement: "gluXfK7zg1d", value: timePart },
      { dataElement: "bkissws06TK", value: timePart },
    ],
    eventDate: datePart,
  };
}

function f42(encounter) {
  const obsDatetime = findObsByConcept(
    encounter,
    "7f00c65d-de60-467a-8964-fe80c7a85ef0"
  )?.value;
  if (!obsDatetime) return { dataValues: [], eventDate: null };

  return {
    dataValues: [{ dataElement: "xr2Dqw14DGX", value: obsDatetime }],
    eventDate: obsDatetime.replace("+0000", ""),
  };
}

function f43(encounter, tei, dhis2Attr) {
  const mappings = [];
  let eventDate = null;

  // Date/Time mapping (Question #1)
  // Concept: 88472a4e-f26e-4235-8144-4ad6df874949
  const obsDatetime = findObsByConcept(
    encounter,
    "88472a4e-f26e-4235-8144-4ad6df874949"
  )?.value;

  if (obsDatetime) {
    const datePart = obsDatetime.substring(0, 10);
    const timePart = obsDatetime.substring(11, 16);
    eventDate = datePart;
    mappings.push(
      {
        dataElement: "tR7XL9TPVkr", // Emergency Room - Discharge date
        value: datePart,
      },
      {
        dataElement: "P8bmDESxYqn", // Emergency Room - Time of discharge (HH:MM)
        value: timePart,
      }
    );
  }

  // Age calculations with fallback logic
  const birthdate = tei?.attributes?.find(
    (attr) => attr.attribute === dhis2Attr.birthdate
  )?.value;

  // Age in years (BA7aQjiwlrL) - from attribute or calculated from DOB
  let ageInYears = tei?.attributes?.find(
    (attr) => attr.attribute === dhis2Attr.ageInYears
  )?.value;

  if (!ageInYears && birthdate) {
    ageInYears = calculateAge(birthdate);
  }

  if (ageInYears) {
    mappings.push({
      dataElement: "BA7aQjiwlrL", // Emergency Room - Age in years
      value: ageInYears,
    });
  }

  // Age in months (hT8pIot8b6Y) - from attribute or calculated from DOB
  let ageInMonths = tei?.attributes?.find(
    (attr) => attr.attribute === dhis2Attr.ageInMonth
  )?.value;

  if (!ageInMonths && birthdate) {
    const birth = new Date(birthdate);
    const now = new Date();
    const diffTime = Math.abs(now - birth);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    ageInMonths = Math.floor(diffDays / 30.44); // approximate months
  }

  if (ageInMonths) {
    mappings.push({
      dataElement: "hT8pIot8b6Y", // Emergency Room - Age in months
      value: ageInMonths,
    });
  }

  // Age in days (Z2RzJFkXzII) - calculated from DOB if available
  if (birthdate) {
    mappings.push({
      dataElement: "Z2RzJFkXzII", // Emergency Room - Age in days
      value: ageInDays(birthdate, encounter.encounterDatetime),
    });
  }

  return { dataValues: mappings, eventDate };
}

function f61(encounter, tei, state) {
  const { dhis2Map } = state;
  const attributeMap = {
    SRy50Q7NxIO: dhis2Map.attr.ageInYears, // Travel Medicine - Age in years
    soFBcn6mxUk: dhis2Map.attr.sex, // Travel Medicine - Gender
    HA3gBgKwZzw: dhis2Map.attr.currentStatus, // Travel Medicine - Current status
    CeQKylwVj7u: dhis2Map.attr.nationality, // Travel Medicine - Nationality
    vqMs7hmPtFT: dhis2Map.attr.placeOfliving, // Travel Medicine - Place of living
  };
  const attributeMapping = mapAttribute(tei.attributes, attributeMap);

  return [
    ...attributeMapping,
    {
      dataElement: "wqSAGFM1Oz8",
      value: encounter.obs.some(
        (o) => o.concept.uuid === "2ff0d1ad-df05-4128-b2d2-d72307a6aa3f"
      )
        ? "true"
        : "false",
    },
    {
      dataElement: "wiOCvUUHUEr",
      value: encounter.obs.find((o) => {
        return (
          o.concept.uuid === "d0e31c9b-fb6b-4d8b-9c54-c8410c719f1c" &&
          o.formFieldPath === "rfe-forms-howDoYouPlanToTravel" &&
          o.value.uuid === "1eff97cc-bec8-4bdf-9022-dc0f2132c260"
        );
      })?.value?.display
        ? "road"
        : undefined,
    },
  ].filter((d) => d.value);
}

function f64(encounter) {
  const mappings = [];

  // Admission date and time (Question #1)
  // Concept: 7f00c65d-de60-467a-8964-fe80c7a85ef0
  const admissionTime = findObsByConcept(
    encounter,
    "7f00c65d-de60-467a-8964-fe80c7a85ef0"
  )?.value;

  if (admissionTime) {
    const timePart = admissionTime.substring(11, 16);
    mappings.push({
      dataElement: "KDZguOxdsZk", // ICU - Admission time
      value: timePart,
    });
  }

  return mappings;
}

function f65(encounter) {
  const mappings = [];
  // Discharge date and time (Question #1)
  // Concept: d92dd800-b048-4724-86fa-91d006f9caa8
  const dischargeDateTime = findObsByConcept(
    encounter,
    "d92dd800-b048-4724-86fa-91d006f9caa8"
  )?.value;

  if (dischargeDateTime) {
    const datePart = dischargeDateTime.substring(0, 10);
    const timePart = dischargeDateTime.substring(11, 16);
    mappings.push(
      {
        dataElement: "GwlaaueZOz1", // ICU - Discharge date
        value: datePart,
      },
      {
        dataElement: "Me7I97tO6lt", // ICU - Discharge time (HH:MM)
        value: timePart,
      }
    );
  }

  return mappings;
}

function f66(encounter, state) {
  const mappings = [];

  const hasObsByQid = (qid, valueUuid) =>
    encounter.obs.some(
      (o) => o.formFieldPath === qid && o.value?.uuid === valueUuid
    );

  // Shared cytotoxic answer → DHIS2 option UID map (used by two data elements)
  const cytotoxicMap = [
    {
      answerUuid: "c211de3b-94b8-4a5f-8a4b-7af8b0ff3691", // Bite site swelling, redness ('dry bite') - Cytotoxic
      optionUid: "oARwiGgobcd",
    },
    {
      answerUuid: "0860f31c-ef22-4559-9ee2-bcc645790d4e", // Bite site burning pain, swelling, discoloration - Cytotoxic (mild)
      optionUid: "h1twBaWpKPF",
    },
    {
      answerUuid: "11ffda1d-cd58-4ac2-a642-be686895813b", // Bite site blistering, necrosis, enlarged lymph nodes - Cytotoxic (severe)
      optionUid: "Tz3eOWkiFPW",
    },
  ];

  const resolveOptionCode = (optionUid) =>
    state.optsMap.find((o) => o["DHIS2 Option UID"] === optionUid)?.[
      "DHIS2 Option Code"
    ];

  // Snakebites - Cytotoxic (bRpRhiyU9om) — sourced from 'Signs and symptoms' (rfe-forms-signsAndSymptoms)
  const cytotoxicMatch = cytotoxicMap.find(({ answerUuid }) =>
    hasObsByQid("rfe-forms-signsAndSymptoms", answerUuid)
  );
  if (cytotoxicMatch) {
    const optionCode = resolveOptionCode(cytotoxicMatch.optionUid);
    if (optionCode)
      mappings.push({ dataElement: "bRpRhiyU9om", value: optionCode });
  }

  // Snakebites - 6h exit: Cytotoxic (uZOKOcCGHqE) — sourced from 'Signs and symptoms evolution' (rfe-forms-signsAndSymptomsEvolution)
  const evolutionMatch = cytotoxicMap.find(({ answerUuid }) =>
    hasObsByQid("rfe-forms-signsAndSymptomsEvolution", answerUuid)
  );
  if (evolutionMatch) {
    const optionCode = resolveOptionCode(evolutionMatch.optionUid);
    if (optionCode)
      mappings.push({ dataElement: "uZOKOcCGHqE", value: optionCode });
  }

  // Hematotoxic logic helper: evaluates conditions for a given question ID scope
  const resolveHematotoxic = (qid) => {
    const isBleeding = hasObsByQid(qid, "d14d3774-1595-479d-829a-6c81f98a32d0"); // Bleeding - Hematotoxic
    const isNotClotting = hasObsByQid(
      qid,
      "5b714e83-fdc6-4893-9d8e-7a2353d93878"
    ); // Not clotting - Hematotoxic
    const isClotting = hasObsByQid(qid, "fc49b380-fbf8-42a7-abbf-a3ca32b03b67"); // Clotting

    const hematotoxicMap = [
      { condition: isBleeding && !isNotClotting, optionUid: "TL1JkvBhwZj" }, // bleeding
      { condition: !isBleeding && isNotClotting, optionUid: "C9YeFTRG7hR" }, // not_clotting
      { condition: isBleeding && isNotClotting, optionUid: "C08j0szZSKz" }, // both
      { condition: !isBleeding && isClotting, optionUid: "aNsED3NFbns" }, // no
    ];

    return hematotoxicMap.find(({ condition }) => condition);
  };

  // Snakebites - Hematotoxic (etjys3ZhdrZ) — sourced from 'Signs and symptoms' (rfe-forms-signsAndSymptoms)
  const hematotoxicMatch = resolveHematotoxic("rfe-forms-signsAndSymptoms");
  if (hematotoxicMatch) {
    const optionCode = resolveOptionCode(hematotoxicMatch.optionUid);
    if (optionCode)
      mappings.push({ dataElement: "etjys3ZhdrZ", value: optionCode });
  }

  // Snakebites - 6h exit: Hematotoxic (kFjWm5ZYkS2) — sourced from 'Signs and symptoms evolution' (rfe-forms-signsAndSymptomsEvolution)
  const hematotoxicEvolutionMatch = resolveHematotoxic(
    "rfe-forms-signsAndSymptomsEvolution"
  );
  if (hematotoxicEvolutionMatch) {
    const optionCode = resolveOptionCode(hematotoxicEvolutionMatch.optionUid);
    if (optionCode)
      mappings.push({ dataElement: "kFjWm5ZYkS2", value: optionCode });
  }

  // Snakebites - Other AE - specify (qWq8p9M0OFn): fill with 'other' (text)
  // if 'Other' is selected in 'Adverse events from treatment' (rfe-forms-adverseEventsFromTreatment)
  if (
    hasObsByQid(
      "rfe-forms-adverseEventsFromTreatment",
      "790b41ce-e1e7-11e8-b02f-0242ac130002"
    )
  ) {
    mappings.push({ dataElement: "qWq8p9M0OFn", value: "other" });
  }

  return mappings;
}

function f67(tei, dhis2Map) {
  const birthdate = tei?.attributes?.find(
    (attr) => attr.attribute === dhis2Map.attr.birthdate
  )?.value;

  // Calculate patient age in months from birthdate
  let ageInMonths = null;
  if (birthdate) {
    const birth = new Date(birthdate);
    const now = new Date();
    const diffTime = Math.abs(now - birth);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    ageInMonths = Math.floor(diffDays / 30.44);
  }

  // Base attribute mappings
  const attributeMap = {
    KVIidg9rDcd: dhis2Map.attr.patientNumber, // Cholera - Patient number
    j5tAuXutbsp: dhis2Map.attr.sex, // Cholera - Sex
    EX28AP1WI0B: dhis2Map.attr.placeOfliving, // Cholera - Place of living
  };
  const mapping = mapAttribute(tei.attributes, attributeMap);

  // Conditional age mapping based on patient age
  if (ageInMonths !== null) {
    if (ageInMonths > 23) {
      // Age > 23 months: use age in years
      const ageInYears = tei?.attributes?.find(
        (attr) => attr.attribute === dhis2Map.attr.ageInYears
      )?.value;
      if (ageInYears) {
        mapping.push({ dataElement: "KfrcDYB9Axf", value: ageInYears });
      }
    } else if (ageInMonths >= 1 && ageInMonths <= 23) {
      // Age >= 1 month and <= 23 months: use age in months
      const ageInMonthsValue = tei?.attributes?.find(
        (attr) => attr.attribute === dhis2Map.attr.ageInMonth
      )?.value;
      if (ageInMonthsValue) {
        mapping.push({ dataElement: "SmJJ7aBGe4e", value: ageInMonthsValue });
      }
    }
  }

  return mapping;
}

function mapAttribute(attributes, attributeMap) {
  const attrMapping = Object.entries(attributeMap)
    .map(([dataElement, attributeId]) => {
      const value = attributes?.find(
        (attr) => attr.attribute === attributeId
      )?.value;

      return { dataElement, value };
    })
    .filter(Boolean);

  return attrMapping;
}

const buildDataValues = (pairedEncounters, tei, state) => {
  const { dhis2Map } = state;

  const f08Uuid = formIdByName("F08-ITFC Admission", state.formMaps);
  const f09Uuid = formIdByName("F09-ITFC Discharge", state.formMaps);
  const f23Uuid = formIdByName("F23-Neonatal Admission", state.formMaps);
  const f24Uuid = formIdByName("F24-Neonatal Discharge", state.formMaps);
  const f25Uuid = formIdByName("F25-Pediatrics Admission", state.formMaps);
  const f26Uuid = formIdByName("F26-Pediatrics Discharge", state.formMaps);
  const f27Uuid = formIdByName("F27-Adult Admission", state.formMaps);
  const f28Uuid = formIdByName("F28-Adult Discharge", state.formMaps);
  const f41Uuid = formIdByName("F41-ER Triage", state.formMaps);
  const f42Uuid = formIdByName("F42-ER Consultation", state.formMaps);
  const f43Uuid = formIdByName("F43-ER Exit", state.formMaps);
  const f64Uuid = formIdByName("F64-ICU Admission", state.formMaps);
  const f65Uuid = formIdByName("F65-ICU Discharge", state.formMaps);
  const f66Uuid = formIdByName("F66-Snakebites", state.formMaps);
  const f67Uuid = formIdByName("F67-Cholera", state.formMaps);
  const f61Uuid = formIdByName("F61-Travel medicine", state.formMaps);

  let formMapping = [];
  let eventDate = null;

  const encounterOrder = (name) => {
    const match = name.match(/F(\d+)/);
    return match ? parseInt(match[1], 10) : Infinity;
  };

  // Sort encounters by F-number (F00 first, F99 last)
  const sortedEncounters = [...pairedEncounters].sort(
    (a, b) => encounterOrder(a.form.name) - encounterOrder(b.form.name)
  );

  sortedEncounters.forEach((encounter) => {
    const form = state.formMaps[encounter.form.uuid];
    if (!form?.dataValueMap) {
      return null;
    }
    const dataValuesMapping = Object.keys(form.dataValueMap)
      .map((dataElement) => {
        const value = findDataValue(encounter, dataElement, state);
        return { dataElement, value };
      })
      .filter((d) => d.value);

    // Discharge form values override any previously mapped dataElements with the same uuid
    if (encounter.form.name.includes("Discharge")) {
      formMapping = Object.values(
        [...formMapping, ...dataValuesMapping].reduce((acc, obj) => {
          acc[obj.dataElement] = { ...acc[obj.dataElement], ...obj };
          return acc;
        }, {})
      );
    } else {
      formMapping.push(...dataValuesMapping);
    }

    const multiSelectDvs = multiSelectAns(
      encounter,
      state.formMaps[encounter.form.uuid]?.multiSelectQns
    );
    formMapping.push(...multiSelectDvs);

    if (f08Uuid === encounter.form.uuid) {
      // F08 Form Encounter Mapping
      const { dataValues: f8DataValues, eventDate: f8EventDate } =
        f8(encounter);
      formMapping.push(...f8DataValues);
      if (f8EventDate) eventDate = f8EventDate;
    }
    if (f09Uuid === encounter.form.uuid) {
      // F09 Form Encounter Mapping
      const attributeMap = {
        Lg1LrNf9LQR: dhis2Map.attr.sex,
        OVo3FxLURtH: dhis2Map.attr.ageInMonth,
        f3n6kIB9IbI: dhis2Map.attr.ageInYears, // TODO:we see this in metadata "Rv8WM2mTuS5",
        oc9zlhOoWmP: dhis2Map.attr.currentStatus,
        DbyD9bbGIvE: dhis2Map.attr.legalStatus,
        fiPFww1viBB: dhis2Map.attr.placeOfliving,
        FsL5BjQocuo: dhis2Map.attr.nationality,
        Pi1zytYdq6l: dhis2Map.attr.patientNumber,
      };
      const f09Mapping = mapAttribute(tei.attributes, attributeMap);
      formMapping.push(...f09Mapping);
    }
    if (f61Uuid === encounter.form.uuid) {
      const f61Mapping = f61(encounter, tei, state);
      formMapping.push(...f61Mapping);
    }

    if (f24Uuid === encounter.form.uuid) {
      // F24 Form Encounter Mapping
      // Maps TEI attributes to DHIS2 data elements
      const attributeMap = {
        Hww0CNYYt3E: dhis2Map.attr.sex, // Sex from Patient registration
        yE0dIWW0TXP: dhis2Map.attr.placeOfliving, // Place of living
        fnH6H3biOkE: dhis2Map.attr.patientNumber, // Patient number (MSF ID)
      };
      const attributeMapping = mapAttribute(tei.attributes, attributeMap);

      // Age in days (Z7vMFdnQxpE) - calculated from birthdate if available
      const dob = tei?.attributes?.find(
        (attr) => attr.attribute === dhis2Map.attr.birthdate
      )?.value;

      if (dob) {
        const ageInDaysValue = ageInDays(dob, encounter.encounterDatetime);
        attributeMapping.push({
          dataElement: "Z7vMFdnQxpE",
          value: ageInDaysValue,
        });
      }

      // Age in months (L97SmAK11DN) - from estimated age if DOB not available
      if (!dob) {
        const ageInMonthsValue = tei?.attributes?.find(
          (attr) => attr.attribute === dhis2Map.attr.ageInMonth
        )?.value;

        if (ageInMonthsValue) {
          attributeMapping.push({
            dataElement: "L97SmAK11DN",
            value: ageInMonthsValue,
          });
        }
      }

      formMapping.push(...attributeMapping);
    }
    if (f26Uuid === encounter.form.uuid) {
      const attributeMap = {
        d7wOfzPBbQD: dhis2Map.attr.ageInYears,
        y9pK9sVcbU9: dhis2Map.attr.ageInMonth,
        CDuiRuOcfzj: dhis2Map.attr.currentStatus,
        Nd43pz1Oo62: dhis2Map.attr.placeOfliving,
        kcSuQKfU5Zo: dhis2Map.attr.patientNumber,
      };
      const attributeMapping = mapAttribute(tei.attributes, attributeMap);

      // Custom mapping for sex and legalStatus (f26 only)
      // Sex: leave blank if value is "unknown" or "other"
      const sexValue = tei?.attributes?.find(
        (attr) => attr.attribute === dhis2Map.attr.sex
      )?.value;
      const sexMapping = {
        dataElement: "eDuqRYx3wLx",
        value: ["unknown", "other"].includes(sexValue?.toLowerCase())
          ? ""
          : sexValue,
      };

      // LegalStatus: convert "asylum_seeker" to "asylum-seeker"
      const legalStatusValue = tei?.attributes?.find(
        (attr) => attr.attribute === dhis2Map.attr.legalStatus
      )?.value;
      const legalStatusMapping = {
        dataElement: "JMhFzB97fcS",
        value:
          legalStatusValue === "asylum_seeker"
            ? "asylum-seeker"
            : legalStatusValue,
      };

      attributeMapping.push(sexMapping, legalStatusMapping);

      const dob = tei?.attributes?.find(
        (attr) => attr.attribute === dhis2Map.attr.birthdate
      )?.value;

      const f26Mapping = f26(encounter, state);
      attributeMapping.push(...f26Mapping);
      if (dob) {
        let ageInDays = calculateAge(dob) * 365;
        attributeMapping.push({
          dataElement: "b7z6xIpzkim",
          value: ageInDays,
        });
      }

      formMapping.push(...attributeMapping);
    }

    // F27 Form Encounter Mapping
    if (f27Uuid === encounter.form.uuid) {
      const { dataValues: f27DataValues, eventDate: f27EventDate } =
        f27(encounter);
      formMapping.push(...f27DataValues);
      if (f27EventDate) eventDate = f27EventDate;
    }

    if (f28Uuid === encounter.form.uuid) {
      // F28 Form Encounter Mapping
      const attributeMap = {
        WP5vr8KB2lH: dhis2Map.attr.sex,
        Y7qzoa4Qaiz: dhis2Map.attr.currentStatus,
        XCUd9xOGXkn: dhis2Map.attr.legalStatus,
        onKT21rxH6Z: dhis2Map.attr.placeOfliving,
        sCKCNreiqEA: dhis2Map.attr.nationality,
        ci9C72RjN8Z: dhis2Map.attr.patientNumber,
      };
      const attributeMapping = mapAttribute(tei.attributes, attributeMap);

      const f28Mapping = [
        {
          dataElement: "NWOnMq8h4w1",
          value: teiAge(tei, dhis2Map.attr),
        },
      ];
      formMapping.push(...attributeMapping, ...f28Mapping);
    }

    if (f41Uuid === encounter.form.uuid) {
      const { dataValues: f41DataValues, eventDate: f41EventDate } =
        f41(encounter);
      formMapping.push(...f41DataValues);
      if (f41EventDate) eventDate = f41EventDate;
    }
    if (f42Uuid === encounter.form.uuid) {
      // F42 Form Encounter Mapping
      const { dataValues: f42DataValues, eventDate: f42EventDate } =
        f42(encounter);
      formMapping.push(...f42DataValues);
      if (f42EventDate) eventDate = f42EventDate;
    }
    if (f43Uuid === encounter.form.uuid) {
      // F43 Form Encounter Mapping - TEI attributes and custom logic
      const attributeMap = {
        gHPt2FCZEE6: dhis2Map.attr.patientNumber, // Emergency Room - Patient number
        eMXqL66pJSV: dhis2Map.attr.sex, // Emergency Room - Sex
        xw5Vres1Ndt: dhis2Map.attr.placeOfliving, // Emergency Room - Place of living
        iGHeO9F8CKm: dhis2Map.attr.nationality, // Emergency Room - Nationality
        KRNhyZHeGGM: dhis2Map.attr.currentStatus, // Emergency Room - Current status
        fUxvDvbPKlU: dhis2Map.attr.legalStatus, // Emergency Room - Legal status
      };
      const f43AttributeMapping = mapAttribute(tei.attributes, attributeMap);
      // Note: Age fields (years, months, days) are now handled in f43() with fallback logic
      const { dataValues: f43DataValues, eventDate: f43EventDate } = f43(
        encounter,
        tei,
        dhis2Map.attr
      );
      formMapping.push(...f43AttributeMapping, ...f43DataValues);
      if (f43EventDate) eventDate = f43EventDate;
    }

    if (f64Uuid === encounter.form.uuid) {
      // F64 Form Encounter Mapping
      const f64Mapping = f64(encounter);
      formMapping.push(...f64Mapping);

      // F64/F65 Form - TEI Attributes (shared between admission and discharge)
      const birthdate = tei?.attributes?.find(
        (attr) => attr.attribute === dhis2Map.attr.birthdate
      )?.value;

      const sex = tei?.attributes?.find(
        (attr) => attr.attribute === dhis2Map.attr.sex
      )?.value;

      // Calculate patient age in months from birthdate
      let ageInMonths = null;
      if (birthdate) {
        const birth = new Date(birthdate);
        const now = new Date();
        const diffTime = Math.abs(now - birth);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        ageInMonths = Math.floor(diffDays / 30.44); // approximate months
      }

      // Base attribute mappings
      const attributeMap = {
        j855dPp9p18: dhis2Map.attr.patientNumber, // ICU - Patient number
        // icmcR6av0Ob: dhis2Map.attr.sex, // ICU - Sex
        OI2H3dEQLdQ: dhis2Map.attr.placeOfliving, // ICU - Place of living
        QiVXQ2eAtpN: dhis2Map.attr.nationality, // ICU - Nationality
      };
      const f64AttributeMapping = mapAttribute(tei.attributes, attributeMap);

      if (sex) {
        const value = sex === "unknown" ? "others" : sex;
        f64AttributeMapping.push({
          dataElement: "icmcR6av0Ob",
          value: value,
        });
      }
      // Conditional age mapping based on patient age
      if (ageInMonths !== null) {
        if (ageInMonths > 23) {
          // Age > 23 months: use age in years
          const ageInYears = tei?.attributes?.find(
            (attr) => attr.attribute === dhis2Map.attr.ageInYears
          )?.value;

          if (ageInYears) {
            f64AttributeMapping.push({
              dataElement: "PLj9LCQy6Wb",
              value: ageInYears,
            });
          }
        } else if (ageInMonths >= 1 && ageInMonths <= 23) {
          // Age >= 1 month and <= 23 months: use age in months
          const ageInMonthsValue = tei?.attributes?.find(
            (attr) => attr.attribute === f64AgeInMonthsAttr
          )?.value;
          if (ageInMonthsValue) {
            f64AttributeMapping.push({
              dataElement: "orwtudPV2yK",
              value: ageInMonthsValue,
            });
          }
        } else if (ageInMonths < 1) {
          // Age < 1 month: use age in days
          const ageInDaysValue = ageInDays(
            birthdate,
            encounter.encounterDatetime
          );
          f64AttributeMapping.push({
            dataElement: "JY56Vj7fYiu",
            value: ageInDaysValue,
          });
        }
      }

      formMapping.push(...f64AttributeMapping);
    }

    if (f65Uuid === encounter.form.uuid) {
      const f65Form = state.formMaps[f65Uuid];
      // F65 Form Encounter Mapping - Custom mappings
      const f65Mapping = f65(encounter, f65Form);
      formMapping.push(...f65Mapping);
    }

    if (f66Uuid === encounter.form.uuid) {
      // F66 Form Encounter Mapping - Custom mappings
      const f66Mapping = f66(encounter, state);
      formMapping.push(...f66Mapping);

      const birthdate = tei?.attributes?.find(
        (attr) => attr.attribute === dhis2Map.attr.birthdate
      )?.value;

      // Calculate patient age in months from birthdate
      let ageInMonths = null;
      if (birthdate) {
        const birth = new Date(birthdate);
        const now = new Date();
        const diffTime = Math.abs(now - birth);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        ageInMonths = Math.floor(diffDays / 30.44); // approximate months
      }

      // Base attribute mappings
      const attributeMap = {
        ipRL5PApBZk: dhis2Map.attr.patientNumber, // Snakebites - Patient number
        ZlONTbktjvX: dhis2Map.attr.sex, // Snakebites - Sex
        XK6Wnp4aBvi: dhis2Map.attr.placeOfliving, // Snakebites - Place of living
      };
      const f66AttributeMapping = mapAttribute(tei.attributes, attributeMap);

      // Conditional age mapping based on patient age
      if (ageInMonths !== null) {
        if (ageInMonths > 23) {
          // Age > 23 months: use age in years
          const ageInYears = tei?.attributes?.find(
            (attr) => attr.attribute === dhis2Map.attr.ageInYears
          )?.value;
          if (ageInYears) {
            f66AttributeMapping.push({
              dataElement: "InDF3cCb32B",
              value: ageInYears,
            });
          }
        } else if (ageInMonths <= 23) {
          // Age <= 23 months: use age in months
          const ageInMonthsValue = tei?.attributes?.find(
            (attr) => attr.attribute === f64AgeInMonthsAttr
          )?.value;
          if (ageInMonthsValue) {
            f66AttributeMapping.push({
              dataElement: "U5BMuwXeRbl",
              value: ageInMonthsValue,
            });
          }
        }
      }

      formMapping.push(...f66AttributeMapping);
    }

    if (f67Uuid === encounter.form.uuid) {
      // F67 Form Encounter Mapping - Cholera Outbreaks
      const f67Mapping = f67(tei, dhis2Map);
      formMapping.push(...f67Mapping);
    }
  });

  //setting the visitUuid here as a data element
  const combinedMapping = formMapping.filter(
    (dv) => dv.value !== undefined && dv.value !== null
  );

  return { dataValues: combinedMapping, eventDate };
};

fn((state) => {
  state.missingOptsets ??= [];

  const pairedEncounters = state.latestEncountersByVisit.reduce((acc, obj) => {
    const program = state.formMaps[obj.form.uuid].programId;
    const orgUnit = state.formMaps[obj.form.uuid].orgUnit;
    const programStage = state.formMaps[obj.form.uuid].programStage;
    const patientOuProgram = `${orgUnit}:${program}:${programStage}:${obj.patient.uuid}:${obj.visit.uuid}`;
    if (!acc[patientOuProgram]) {
      acc[patientOuProgram] = [];
    }
    acc[patientOuProgram].push(obj);
    return acc;
  }, {});

  state.pairedEncounters = pairedEncounters;
  state.eventsMapping = Object.entries(pairedEncounters).map(
    ([patientKey, patientEncounters]) => {
      const [orgUnit, program, programStage, patientUuid] =
        patientKey.split(":");

      const tei = state.TEIs[patientUuid];

      const { dataValues, eventDate: customEventDate } = buildDataValues(
        patientEncounters,
        tei,
        state
      );

      const latestEncounter = patientEncounters.sort(
        (a, b) => new Date(b.encounterDatetime) - new Date(a.encounterDatetime)
      )[0];

      const eventDate =
        customEventDate ??
        latestEncounter?.encounterDatetime.replace("+0000", "");

      const patientNumber = tei?.attributes?.find(
        (a) => a.code === "patient_number"
      ).value;

      const visitUuid = latestEncounter.visit.uuid;
      const event = state.eventsByPatient[`${orgUnit}-${program}`]?.[
        patientNumber
      ]?.find((e) => e.visitUuid === visitUuid)?.event;
      if (event) {
        console.log("Event found:", event);
      }
      if (!dataValues.some((dv) => dv.dataElement === "rbFVBI2N6Ex")) {
        dataValues.push({
          dataElement: "rbFVBI2N6Ex",
          value: visitUuid,
        });
      }
      return {
        event,
        program,
        orgUnit,
        occurredAt: eventDate,
        programStage,
        dataValues,
        trackedEntity: tei.trackedEntity,
      };
    }
  );

  return state;
});
