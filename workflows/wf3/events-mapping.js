const f08Form = "f0bb3bf7-4e0a-3545-afce-a6b33b0378e4";
const f09Form = "6e1e468b-00b1-3e5d-a8cf-00f45b8fe261";
const f23Form = "1b14d9e6-0569-304e-9d4e-f9df40762dff";
const f24Form = "399cf41a-ea2a-39e3-8758-508e79729656";
const f25Form = "c4db716a-f9d0-35df-a589-d5caf2dfb106";
const f26Form = "afcf2993-233e-385b-8030-74a8b475eccd";
const f27Form = "ac97ec76-5647-3153-b4e1-2eceae121e50";
const f28Form = "893ef4b7-5ad1-39e7-8515-eab308ccd636";

const encountersFormPairs = (encounters, formsUuids) => {
  const { f08Form, f09Form, f23Form, f27Form, f28Form, f25Form, f26Form } =
    formsUuids;
  const f8f9Encounters = encounters.filter(
    (e) => e.form.uuid === f08Form || e.form.uuid === f09Form
  );
  const f23f24Encounters = encounters.filter(
    (e) => e.form.uuid === f23Form || e.form.uuid === f24Form
  );
  const f25f26Encounters = encounters.filter(
    (e) => e.form.uuid === f25Form || e.form.uuid === f26Form
  );
  const f27f28Encounters = encounters.filter(
    (e) => e.form.uuid === f27Form || e.form.uuid === f28Form
  );

  return {
    f8f9Encounters,
    f23f24Encounters,
    f27f28Encounters,
    f25f26Encounters,
  };
};

const MILLISECONDS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
const calculateAge = (dob) =>
  Math.floor((new Date() - new Date(dob)) / MILLISECONDS_PER_YEAR);

const teiAge = (tei) => {
  let age = tei?.attributes?.find(
    (attr) => attr.attribute === "T1iX2NuPyqS"
  )?.value;

  if (!age) {
    const birthdate = tei?.attributes?.find(
      (attr) => attr.attribute === "WDp4nVor9Z7"
    )?.value;
    age = calculateAge(birthdate);
  }
  return age;
};

function f8(encounter) {
  const obsDatetime = findObsByConcept(
    encounter,
    "7f00c65d-de60-467a-8964-fe80c7a85ef0"
  )?.obsDatetime;

  const datePart = obsDatetime.substring(0, 10);
  const timePart = obsDatetime.substring(11, 19);
  return [
    {
      dataElement: "yprMS34o8s3",
      value: encounter.encounterDatetime,
    },
    {
      dataElement: "iQio7NYSA3m",
      value: datePart,
    },
    {
      dataElement: "yprMS34o8s3",
      value: timePart,
    },
  ];
}

function f27(encounter) {
  const admissionDate = findObsByConcept(
    encounter,
    "7f00c65d-de60-467a-8964-fe80c7a85ef0"
  )?.value;

  return [
    {
      dataElement: "eYvDzr2m8f5",
      value: admissionDate,
    },
  ];
}
function f23(encounter) {
  // Define concept mappings object for cleaner reference
  const CONCEPT_ID = "f587c6a3-6a71-48ae-83b2-5e2417580b6f";

  const conditions = [
    {
      // 'Neonatal infection in previous pregnancy' is selected in OMRS
      dataElement: "H9noxo3e7ox",
      valueId: "09d6bb71-b061-4cae-85f3-2ff020a10c92",
    },
    {
      // 'Mother got antibiotics during delivery/post-partum ' is selected in OMRS
      dataElement: "GfN1TtpqDoJ",
      valueId: "3764bd79-9ae2-478a-88e7-51adc0a8a2e3",
    },
    {
      //'Infection in other baby if multiple pregnancy' is selected in OMRS
      dataElement: "WS1p4xgbZqU",
      valueId: "95d55453-060b-43a2-b4a0-11848dd9ac72",
    },
    {
      //'Maternal fever during labour' is selected in OMRS
      dataElement: "WX19iDuB4Dj",
      valueId: "890f4bdb-91bc-484c-a9cf-17f5068b0507",
    },
    {
      // 'Rupture of membranes ≥18h' is selected in OMRS
      dataElement: "eLKs6GUHJdS",
      valueId: "28d10ce0-7f72-4654-834d-64fa37ad8e85",
    },
    {
      // 'Pre-labour rupture of membranes <18h' is selected in OMRS
      dataElement: "hCfngwimBjX",
      valueId: "cf48d000-a741-44e0-81cb-a51f88595e41",
    },
    {
      // 'Smelling/cloudy amniotic fluid' is selected in OMRS
      dataElement: "qc7ubAwULxs",
      valueId: "49829d18-22c9-404c-a79a-49ed6b21d2be",
    },
  ];

  // Map through conditions and create final mapping
  return conditions.map((condition) => ({
    dataElement: condition.dataElement,
    value: findByConceptAndValue(encounter, CONCEPT_ID, condition.valueId)
      ? true
      : false,
  }));
}

function teiAttributeMapping(tei, attributeMap) {
  const attrMapping = Object.entries(attributeMap)
    .map(([dataElement, attributeId]) => {
      const value = tei?.attributes?.find(
        (attr) => attr.attribute === attributeId
      )?.value;

      return { dataElement, value };
    })
    .filter(Boolean);

  return attrMapping;
}

const findObsByConcept = (encounter, conceptUuid) => {
  const [conceptId, questionId] = conceptUuid.split("-rfe-");
  const answer = encounter.obs.find(
    (o) =>
      o.concept.uuid === conceptId &&
      (questionId ? o.formFieldPath === `rfe-${questionId}` : true)
  );
  return answer;
};

const findByConceptAndValue = (encounter, conceptUuid, value) => {
  const [conceptId, questionId] = conceptUuid.split("-rfe-");
  const answer = encounter.obs.find(
    (o) =>
      o.concept.uuid === conceptId &&
      (questionId ? o.formFieldPath === `rfe-${questionId}` : true) &&
      o.value.uuid === value
  );
  return answer;
};

const findDataValue = (encounter, dataElement, metadataMap) => {
  const { optsMap, optionSetKey, form } = metadataMap;
  const [conceptUuid, questionId] =
    form.dataValueMap[dataElement]?.split("-rfe-");
  const answer = encounter.obs.find((o) => o.concept.uuid === conceptUuid);
  const isObjectAnswer = answer && typeof answer.value === "object";
  const isStringAnswer = answer && typeof answer.value === "string";

  if (isStringAnswer) {
    return answer.value;
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

const buildDataValues = (encounter, form, mappingConfig) => {
  const { optsMap, optionSetKey, tei } = mappingConfig;
  let formMapping = [];
  // F08 Form Encounter Mapping
  if (encounter.form.uuid === f08Form) {
    const f8Mapping = f8(encounter);
    formMapping.push(...f8Mapping);
  }

  // F09 Form Encounter Mapping
  if (encounter.form.uuid === f09Form) {
    const attributeMap = {
      Lg1LrNf9LQR: "qptKDiv9uPl",
      OVo3FxLURtH: "k26cdlS78i9",
      f3n6kIB9IbI: "Rv8WM2mTuS5",
      oc9zlhOoWmP: "YUIQIA2ClN6",
      DbyD9bbGIvE: "Qq6xQ2s6LO8",
      fiPFww1viBB: "rBtrjV1Mqkz",
      FsL5BjQocuo: "Xvzc9e0JJmp",
    };
    const f09Mapping = teiAttributeMapping(tei, attributeMap);
    formMapping.push(...f09Mapping);
  }

  // F23 Form Encounter Mapping
  if (encounter.form.uuid === f23Form) {
    const f23Mapping = f23(encounter);
    formMapping.push(...f23Mapping);
  }

  // F24 Form Encounter Mapping
  if (encounter.form.uuid === f24Form) {
    const attributeMap = {
      Hww0CNYYt3E: "qptKDiv9uPl",
      // Z7vMFdnQxpE: "WDp4nVor9Z7",
      // L97SmAK11DN: "T1iX2NuPyqS",
      yE0dIWW0TXP: "rBtrjV1Mqkz",
    };
    const attributeMapping = teiAttributeMapping(tei, attributeMap);

    const dob = tei?.attributes?.find(
      (attr) => attr.attribute === "WDp4nVor9Z7"
    )?.value;

    if (dob) {
      let ageInDays = calculateAge(dob) * 365;
      attributeMapping.push({
        dataElement: "Z7vMFdnQxpE",
        value: ageInDays,
      });
    }
    if (!dob) {
      const age = tei?.attributes?.find(
        (attr) => attr.attribute === "T1iX2NuPyqS"
      )?.value;

      const ageInMonths = age * 12;

      attributeMapping.push({
        dataElement: "L97SmAK11DN",
        value: ageInMonths,
      });
    }

    formMapping.push(...attributeMapping);
  }

  if (encounter.form.uuid === f26Form) {
    const attributeMap = {
      eDuqRYx3wLx: "qptKDiv9uPl",
      d7wOfzPBbQD: "T1iX2NuPyqS",
      y9pK9sVcbU9: "k26cdlS78i9",
      // b7z6xIpzkim: "",
      CDuiRuOcfzj: "YUIQIA2ClN6",
      JMhFzB97fcS: "Qq6xQ2s6LO8",
      Nd43pz1Oo62: "rBtrjV1Mqkz",
    };
    const attributeMapping = teiAttributeMapping(tei, attributeMap);

    const dob = tei?.attributes?.find(
      (attr) => attr.attribute === "WDp4nVor9Z7"
    )?.value;

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
  if (encounter.form.uuid === f27Form) {
    const f27Mapping = f27(encounter);
    formMapping.push(...f27Mapping);
  }

  // F28 Form Encounter Mapping
  if (encounter.form.uuid === f28Form) {
    const attributeMap = {
      WP5vr8KB2lH: "qptKDiv9uPl",
      Y7qzoa4Qaiz: "YUIQIA2ClN6",
      XCUd9xOGXkn: "Qq6xQ2s6LO8",
      onKT21rxH6Z: "rBtrjV1Mqkz",
      sCKCNreiqEA: "Xvzc9e0JJmp",
    };
    const attributeMapping = teiAttributeMapping(tei, attributeMap);

    const f28Mapping = [
      {
        dataElement: "NWOnMq8h4w1",
        value: teiAge(tei),
      },
    ];
    formMapping.push(...attributeMapping, ...f28Mapping);
  }

  const dataValuesMapping = Object.keys(form.dataValueMap)
    .map((dataElement) => {
      const value = findDataValue(encounter, dataElement, {
        optsMap,
        optionSetKey,
        form,
      });

      return { dataElement, value };
    })
    .filter((d) => d.value);

  const combinedMapping = [...dataValuesMapping, ...formMapping].filter(
    Boolean
  );

  return combinedMapping;
};

fn((state) => {
  // Group encounters by patient UUID
  const encountersByPatient = state.encounters?.reduce((acc, obj) => {
    const key = obj.patient.uuid;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(obj);
    return acc;
  }, {});

  state.eventsMapping = Object.entries(encountersByPatient)
    .map(([patientUuid, patientEncounters]) => {
      const pairedEncounters = Object.values(
        encountersFormPairs(patientEncounters, {
          f08Form,
          f09Form,
          f23Form,
          f27Form,
          f28Form,
          f25Form,
          f26Form,
        })
      );

      return pairedEncounters
        .filter((encounters) => encounters.length === 2)
        .map((encounters) => {
          // Get the forms for both encounters
          const form1 = state.formMaps[encounters[0].form.uuid];
          const form2 = state.formMaps[encounters[1].form.uuid];

          // Skip if either form doesn't have dataValueMap
          if (!form1?.dataValueMap || !form2?.dataValueMap) {
            return null;
          }

          const tei = state.TEIs[patientUuid];

          const dataValues = encounters
            .map((encounter) => {
              const form = state.formMaps[encounter.form.uuid];
              if (!form?.dataValueMap) {
                return null;
              }

              return buildDataValues(encounter, form, {
                optsMap: state.optsMap,
                optionSetKey: state.optionSetKey,
                tei,
              });
            })
            .flat()
            .filter((d) => d.value);

          return {
            program: form1.programId,
            orgUnit: form1.orgUnit,
            occurredAt: encounters[0].encounterDatetime.replace("+0000", ""),
            programStage: form1.programStage,
            dataValues,
            trackedEntityInstance: patientUuid,
          };
        })
        .filter(Boolean);
    })
    .flat()
    .filter(Boolean);

  return state;
});

fn((state) => {
  return {
    eventsMapping: state.eventsMapping,
  };
});
