const f08Form = "f0bb3bf7-4e0a-3545-afce-a6b33b0378e4";
const f09Form = "6e1e468b-00b1-3e5d-a8cf-00f45b8fe261";
const f23Form = "1b14d9e6-0569-304e-9d4e-f9df40762dff";
const f24Form = "399cf41a-ea2a-39e3-8758-508e79729656";
const f25Form = "c4db716a-f9d0-35df-a589-d5caf2dfb106";
const f26Form = "afcf2993-233e-385b-8030-74a8b475eccd";
const f27Form = "ac97ec76-5647-3153-b4e1-2eceae121e50";
const f28Form = "893ef4b7-5ad1-39e7-8515-eab308ccd636";
const f41Form = "a67db828-cf17-3514-b089-5206b5cfb223";
const f42Form = "1a00bf19-b959-32c0-afc5-1a29583b3063";
const f43Form = "b11a57cc-6730-3d6c-a5ec-7949b8af26bc";

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

const ageInDays = (dob, encounterDate) => {
  const birth = new Date(dob);
  const encounter = new Date(encounterDate);
  const diffTime = Math.abs(encounter - birth);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

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

const buildDataValues = (encounter, form, mappingConfig) => {
  const { optsMap, optionSetKey, tei } = mappingConfig;
  let formMapping = [];

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
  const handleMissingRecord = (encounter, state) => {
    const { uuid, display } = encounter.patient;

    console.log(uuid, "Patient is missing trackedEntity or enrollment");

    state.missingRecords ??= {};
    state.missingRecords[uuid] ??= {
      encounters: [],
      patient: display,
    };

    state.missingRecords[uuid].encounters.push(data.uuid);
  };

  state.eventsMapping = state.latestEncountersByVisit
    .map((encounter) => {
      const form = state.formMaps[encounter.form.uuid];

      if (!form?.dataValueMap) {
        return null;
      }
      const { trackedEntity, enrollment, events } =
        state.TEIs[encounter.patient.uuid] || {};

      console.log({ trackedEntity, enrollment, events });
      if (!trackedEntity || !enrollment) {
        handleMissingRecord(encounter, state);
        return null;
      }

      let formDataValues = Object.keys(form.dataValueMap).map((dataElement) => {
        const value = findDataValue(encounter, dataElement, {
          optsMap: state.optsMap,
          optionSetKey: state.optionSetKey,
          form,
        });

        return { dataElement, value };
      });

      return {
        event: events?.find((e) => e.programStage === form.programStage)?.event,
        program: state.formMaps[encounter.form.uuid]?.programId,
        orgUnit: state.formMaps[encounter.form.uuid]?.orgUnit,
        trackedEntity,
        enrollment,
        occurredAt: encounter.encounterDatetime.replace("+0000", ""),
        programStage: form.programStage,
        dataValues: formDataValues,
      };
    })
    .filter(Boolean);
  console.log(state.eventsMapping?.length, "# of events mapped");
  return state;
});
