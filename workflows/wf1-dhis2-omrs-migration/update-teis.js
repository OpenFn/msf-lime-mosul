function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

fn((state) => {
  if (state.newPatientUuid.length === 0) {
    console.log("No data fetched in step prior to sync.");
  }

  // console.log(
  //   'newPatientUuid ::',
  //   JSON.stringify(state.newPatientUuid, null, 2)
  // );
  console.log("newPatientUuid", state.newPatientUuid.length);
  state.patientNumbers = state.newPatientUuid.map((p) => p.patient_number);
  return state;
});

each(
  (state) => chunkArray(state.patientNumbers, 100),
  get("tracker/trackedEntities", {
    orgUnit: $.orgUnit,
    filter: (state) => [
      `${state.dhis2PatientNumberAttributeId}:IN:${state.data.join(";")}`,
    ],
    program: $.program,
    fields: "*",
  }).then((state) => {
    state.foundTrackedEntities ??= [];
    state.foundTrackedEntities.push(...state.data.instances);
    return state;
  })
);

fn((state) => {
  state.patientsMapping = state.newPatientUuid.map((p) => {
    const trackedEntity = state.foundTrackedEntities.find((tei) => {
      return (
        tei.attributes.find(
          (attribute) => attribute.attribute === "AYbfTPYMNJH"
        )?.value === p.uuid
      );
    })?.trackedEntity
    return {
      trackedEntity,
      orgUnit: state.orgUnit,
      program: state.program,
      trackedEntityType: "cHlzCA2MuEF",
      attributes: [
        {
          attribute: `${state.dhis2PatientNumberAttributeId}`,
          value: `${p.patient_number}`,
        }, //DHIS2 patient number to use as lookup key
        { attribute: "AYbfTPYMNJH", value: `${p.uuid}` }, //OMRS patient uuid
        {
          attribute: `${state.openmrsAutoIdAttributeId}`,
          value: `${p.omrs_patient_number.identifier}`,
        }, //id generated in wf1-2 e.g., "IQ146-24-000-027"
      ],
    };
  });
  return state;
});

// Bulk upsert
create(
  "tracker",
  { trackedEntities: $.patientsMapping },
  {
    params: {
      atomicMode: "ALL",
      importStrategy: "CREATE_AND_UPDATE",
      async: false,
    },
  }
);
fn((state) => {
  const {
    data,
    response,
    references,
    patients,
    patientsUpsert,
    placeOflivingMap,
    foundTrackedEntities,
    identifiers,
    patientNumbers,
    ...next
  } = state;

  return next;
});
