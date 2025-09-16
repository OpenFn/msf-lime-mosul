cursor($.manualCursor || $.lastRunDateTime).then((state) => {
  console.log("Date cursor to filter TEI extract ::", state.cursor);
  return state;
});

cursor("now", {
  key: "lastRunDateTime",
  format: (c) => {
    const offset = 2; // GMT+2 (Geneva time)
    c.setHours(c.getHours() + offset);
    return c.toISOString().replace("Z", "");
  },
}).then((state) => {
  console.log("Next sync start date:", state.lastRunDateTime);
  return state;
});

collections.get("mosul-metadata-mappings-staging").then((state) => {
  state.optsMap = state.data
    .filter((i) => i.key.includes("optsMap-value-"))
    .map((i) => i.value);

  state.identifiers = state.data
    .filter((i) => i.key.includes("identifiers-value-"))
    .map((i) => i.value);

  state.fileDateModified = state.data.filter(
    (i) => i.key === "fileDateModified"
  )?.[0]?.value;

  state.formMaps = state.data.find((i) => i.key === "formMaps")?.value;

  delete state.data;
  delete state.references;
  return state;
});

fn(({ identifiers, optsMap, formMaps, ...state }) => {
  state.genderOptions = {
    male: "M",
    female: "F",
    unknown: "U",
    transgender_female: "O",
    transgender_male: "O",
    prefer_not_to_answer: "O",
    gender_variant_non_conforming: "O",
  };
  // state.orgUnit = identifiers.find((i) => i.type === "ORG_UNIT")?.[
  //   "dhis2 attribute id"
  // ];
  // state.program = identifiers.find((i) => i.type === "PROGRAM")?.[
  //   "dhis2 attribute id"
  // ];
  state.orgUnit = "sUpt0j2GmBD"

  state.program = "dWdzxMuKa8Z"
  state.nationalityMap = optsMap
    .filter((o) => o["DHIS2 DE full name"] === "Nationality")
    .reduce((acc, value) => {
      acc[value["DHIS2 Option Code"]] = value["value.uuid - External ID"];
      return acc;
    }, {});

  state.statusMap = optsMap
    .filter((o) => {
      const fullName = o["DHIS2 DE full name"];
      return fullName && fullName.includes(" status");
    })
    .reduce((acc, value) => {
      acc[value["DHIS2 Option Code"]] = value["value.uuid - External ID"];
      return acc;
    }, {});

  state.patientAttributes = Object.entries(formMaps.patient.dataValueMap)
  .filter(([key]) => key !== "qptKDiv9uPl")
  .reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});
  state.dhis2PatientNumber = identifiers.find(
    (i) => i.type === "DHIS2_PATIENT_NUMBER"
  )?.["omrs identifierType"]; //DHIS2 ID or DHIS2 Patient Number

  state.dhis2PatientNumberAttributeId = identifiers.find(
    (i) => i.type === "DHIS2_PATIENT_NUMBER"
  )?.["dhis2 attribute id"]; //DHIS2 ID or DHIS2 Patient Number

  state.openmrsAutoId = identifiers.find((i) => i.type === "OPENMRS_AUTO_ID")?.[
    "omrs identifierType"
  ]; //MSF ID or OpenMRS Patient Number

  state.openmrsAutoIdAttributeId = identifiers.find(
    (i) => i.type === "OPENMRS_AUTO_ID"
  )?.["dhis2 attribute id"]; //MSF ID or OpenMRS Patient Number

  return state;
});
