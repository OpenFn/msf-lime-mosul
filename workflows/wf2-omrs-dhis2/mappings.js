const isValidUUID = (id) => {
  if (!id || typeof id !== "string") return false;

  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return UUID_PATTERN.test(id);
};

collections.get("mosul-metadata-mappings-staging").then((state) => {
  state.optsMap = state.data
    .filter((i) => i.key.includes("optsMap-value-"))
    .map((i) => i.value);

  state.identifiers = state.data
    .filter((i) => i.key.includes("identifiers-value-"))
    .map((i) => i.value);
  state.syncedAt = state.data.find((i) => i.key === "syncedAt")?.value;
  state.formMetadata = state.data.find((i) => i.key === "formMetadata")?.value;
  state.placeOflivingMap = state.data.find(
    (i) => i.key === "placeOflivingMap"
  )?.value;
  state.sourceFile = state.data.filter(
    (i) => i.key === "sourceFile"
  )?.[0]?.value;
  state.fileDateModified = state.data.filter(
    (i) => i.key === "fileDateModified"
  )?.[0]?.value;
  state.formMaps = state.data.find((i) => i.key === "formMaps")?.value;

  // TODO: Remove state.optionSetKey, when needed
  // Build from state.formMaps
  state.optionSetKey = state.data.filter(
    (i) => i.key === "optionSetKey"
  )?.[0]?.value;

  delete state.data;
  delete state.references;
  return state;
});

fn((state) => {
  const { formMetadata, identifiers, ...rest } = state;

  rest.v2FormUuids = formMetadata
    .filter(
      (form) =>
        isValidUUID(form["OMRS form.uuid"]) &&
        form["OMRS Form Version"] === "v4-2025"
    )
    .map((form) => form["OMRS form.uuid"]);
  rest.formUuids = formMetadata
    .filter(
      (form) =>
        isValidUUID(form["OMRS form.uuid"]) && form["Workflow"] === "WF2"
    )
    .map((form) => form["OMRS form.uuid"]);

  rest.patientProgramStage = "vN61drMkGqO";

  rest.orgUnit = "sUpt0j2GmBD";
  // rest.orgUnit = identifiers.find(i => i.type === 'ORG_UNIT')?.[
  //   'dhis2 attribute id'
  // ];
  rest.program = "dWdzxMuKa8Z";
  // rest.program = identifiers.find(i => i.type === 'PROGRAM')?.[
  //   'dhis2 attribute id'
  // ];
  // rest.patientProgramStage = state.formMaps.patient.programStage;

  rest.dhis2PatientNumber = identifiers.find(
    (i) => i.type === "DHIS2_PATIENT_NUMBER"
  )?.["omrs identifierType"]; //DHIS2 ID or DHIS2 Patient Number

  rest.openmrsAutoId = identifiers.find((i) => i.type === "OPENMRS_AUTO_ID")?.[
    "omrs identifierType"
  ]; //MSF ID or OpenMRS Patient Number

  return rest;
});
