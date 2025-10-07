const f08Form = "f0bb3bf7-4e0a-3545-afce-a6b33b0378e4";
const f09Form = "6e1e468b-00b1-3e5d-a8cf-00f45b8fe261";

const processAnswer = (
  answer,
  conceptUuid,
  dataElement,
  optsMap,
  optionSetKey
) => {
  if (typeof answer.value === "object") {
    const optionKey = `${answer.formUuid}-${answer.concept.uuid}`;
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

    // console.log(`matchingOption value: "${matchingOption}" for`);
    // console.log({
    //   optionKey,
    //   conceptUid: answer.concept.uuid,
    //   'answer.value.uid': answer.value.uuid,
    //   'answer.value.display': answer.value.display,
    //   matchingOption,
    //   matchingOptionSet,
    // });

    if (matchingOption === "FALSE" || matchingOption === "No") {
      return "false";
    }
    if (matchingOption === "TRUE" || matchingOption === "Yes") {
      return "true";
    }

    return matchingOption || "";
  }

  return answer.value;
};

const processNoAnswer = (encounter, conceptUuid, dataElement) => {
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

const findAnswerByConcept = (encounter, conceptUuid) => {
  const answer = encounter.obs.find((o) => o.concept.uuid === conceptUuid);
  return answer?.value?.display;
};

// Helper functions for finding observations
const findObsByConcept = (encounter, conceptUuid) =>
  encounter.obs.find((o) => o.concept.uuid === conceptUuid);

// Helper function to process dataValues from an encounter
function processEncounterDataValues(encounter, form, state) {
  return Object.keys(form.dataValueMap)
    .map((dataElement) => {
      const conceptUuid = form.dataValueMap[dataElement];
      const obsAnswer = encounter.obs.find(
        (o) => o.concept.uuid === conceptUuid
      );

      const answer = {
        ...obsAnswer,
        formUuid: encounter.form.uuid,
      };
      const value = answer
        ? processAnswer(
          answer,
          conceptUuid,
          dataElement,
          state.optsMap,
          state.optionSetKey
        )
        : processNoAnswer(encounter, conceptUuid, dataElement);

      return { dataElement, value };
    })
    .filter((d) => d);
}

fn((state) => {
  state.eventsMapping = Object.entries(state.encountersByPatient)
    .map(([patientUuid, encounters]) => {
      // Skip if we don't have exactly 2 encounters
      if (encounters.length !== 2) return null;


      // Get the forms for both encounters
      const form1 = state.formMaps[encounters[0].form.uuid];
      const form2 = state.formMaps[encounters[1].form.uuid];

      // Skip if either form doesn't have dataValueMap
      if (!form1?.dataValueMap || !form2?.dataValueMap) return null;
      const f8Encounter = encounters.find(e => e.form.uuid === f08Form)
      const obsDatetime = findObsByConcept(f8Encounter, '7f00c65d-de60-467a-8964-fe80c7a85ef0')?.obsDatetime

      const datePart = obsDatetime.substring(0, 10);
      const timePart = obsDatetime.substring(11, 19);
      const f8Mapping = [
        {
          dataElement: "yprMS34o8s3",
          value: f8Encounter.encounterDatetime
        },
        {
          dataElement: "iQio7NYSA3m",
          value: datePart
        },
        {
          dataElement: "yprMS34o8s3",
          value: timePart
        }
      ]


      const tei = state.TEIs[patientUuid];
      console.log({ tei, patientUuid })

      const attributeMap = {
        "Lg1LrNf9LQR": "qptKDiv9uPl",
        "OVo3FxLURtH": "k26cdlS78i9",
        "f3n6kIB9IbI": "Rv8WM2mTuS5",
        "oc9zlhOoWmP": "YUIQIA2ClN6",
        "DbyD9bbGIvE": "Qq6xQ2s6LO8",
        "fiPFww1viBB": "rBtrjV1Mqkz",
        "FsL5BjQocuo": "Xvzc9e0JJmp"
      };

      const f9Mapping = Object.entries(attributeMap)
        .map(([dataElement, attributeId]) => {
          const value = tei?.attributes?.find(attr => attr.attribute === attributeId)?.value;

          return { dataElement, value };
        })
        .filter(Boolean);

      // Combine dataValues from both encounters
      const formDataValues = [
        ...f8Mapping,
        ...f9Mapping,
        ...processEncounterDataValues(encounters[0], form1, state),
        ...processEncounterDataValues(encounters[1], form2, state),
      ].filter(d => d.value)

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
