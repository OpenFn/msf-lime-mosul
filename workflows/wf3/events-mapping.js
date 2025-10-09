const f08Form = "f0bb3bf7-4e0a-3545-afce-a6b33b0378e4";
const f09Form = "6e1e468b-00b1-3e5d-a8cf-00f45b8fe261";
const f27Form = "ac97ec76-5647-3153-b4e1-2eceae121e50";
const f28Form = "893ef4b7-5ad1-39e7-8515-eab308ccd636";

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
// Helper function to process dataValues from an encounter
function processEncounterDataValues(encounter, form, state) {
  return Object.keys(form.dataValueMap)
    .map((dataElement) => {
      const value = findDataValue(encounter, dataElement, {
        optsMap: state.optsMap,
        optionSetKey: state.optionSetKey,
        form,
      });

      return { dataElement, value };
    })
    .filter((d) => d);
}

const MILLISECONDS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
const calculateAge = (dob) =>
  Math.floor((new Date() - new Date(dob)) / MILLISECONDS_PER_YEAR);

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
    .map(([patientUuid, encounters]) => {
      // Skip if we don't have exactly 2 encounters
      if (encounters.length !== 2) return null;

      // Get the forms for both encounters
      const form1 = state.formMaps[encounters[0].form.uuid];
      const form2 = state.formMaps[encounters[1].form.uuid];

      // Skip if either form doesn't have dataValueMap

      if (!form1?.dataValueMap || !form2?.dataValueMap) {
        return null;
      }
      let encountersMapping = [];
      const f8Encounter = encounters.find((e) => e.form.uuid === f08Form);

      if (f8Encounter) {
        const obsDatetime = findObsByConcept(
          f8Encounter,
          "7f00c65d-de60-467a-8964-fe80c7a85ef0"
        )?.obsDatetime;

        const datePart = obsDatetime.substring(0, 10);
        const timePart = obsDatetime.substring(11, 19);
        const f8Mapping = [
          {
            dataElement: "yprMS34o8s3",
            value: f8Encounter.encounterDatetime,
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
        encountersMapping.push(...f8Mapping);
      }

      const f27Encounter = encounters.find((e) => e.form.uuid === f27Form);

      if (f27Encounter) {
        const admissionDate = findObsByConcept(
          f27Encounter,
          "7f00c65d-de60-467a-8964-fe80c7a85ef0"
        )?.value;

        const f27Mapping = [
          {
            dataElement: "eYvDzr2m8f5",
            value: admissionDate,
          },
        ];
        encountersMapping.push(...f27Mapping);
      }

      const tei = state.TEIs[patientUuid];
      if (tei) {
        const attributeMap = {
          Lg1LrNf9LQR: "qptKDiv9uPl",
          OVo3FxLURtH: "k26cdlS78i9",
          f3n6kIB9IbI: "Rv8WM2mTuS5",
          oc9zlhOoWmP: "YUIQIA2ClN6",
          DbyD9bbGIvE: "Qq6xQ2s6LO8",
          fiPFww1viBB: "rBtrjV1Mqkz",
          FsL5BjQocuo: "Xvzc9e0JJmp",
          //F28 DSHI2 UID
          WP5vr8KB2lH: "qptKDiv9uPl",
          Y7qzoa4Qaiz: "YUIQIA2ClN6",
          XCUd9xOGXkn: "Qq6xQ2s6LO8",
          onKT21rxH6Z: "rBtrjV1Mqkz",
          sCKCNreiqEA: "Xvzc9e0JJmp",
        };

        const attributeMapping = Object.entries(attributeMap)
          .map(([dataElement, attributeId]) => {
            const value = tei?.attributes?.find(
              (attr) => attr.attribute === attributeId
            )?.value;

            return { dataElement, value };
          })
          .filter(Boolean);

        let age = tei?.attributes?.find(
          (attr) => attr.attribute === "T1iX2NuPyqS"
        )?.value;

        if (!age) {
          const birthdate = tei?.attributes?.find(
            (attr) => attr.attribute === "WDp4nVor9Z7"
          )?.value;
          age = calculateAge(birthdate);
        }

        const f28Mapping = [
          {
            dataElement: "NWOnMq8h4w1",
            value: age,
          },
        ];
        encountersMapping.push(...attributeMapping, ...f28Mapping);
      }

      // Combine dataValues from both encounters
      const formDataValues = [
        ...encountersMapping,
        ...processEncounterDataValues(encounters[0], form1, state),
        ...processEncounterDataValues(encounters[1], form2, state),
      ].filter((d) => d.value);

      // Use properties from the first encounter for the event metadata
      // (or choose which encounter to use for each field)
      return {
        program: form1.programId,
        orgUnit: form1.orgUnit,
        occurredAt: encounters[0].encounterDatetime.replace("+0000", ""),
        programStage: form1.programStage,
        dataValues: formDataValues,
        trackedEntityInstance: patientUuid,
      };
    })
    .filter(Boolean);

  return state;
});

fn((state) => {
  return {
    eventsMapping: state.eventsMapping,
  };
});
