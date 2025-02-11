fn(state => {
  if (state.newPatientUuid.length === 0) {
    console.log('No data fetched in step prior to sync.');
  }

  console.log(
    'newPatientUuid ::',
    JSON.stringify(state.newPatientUuid, null, 2)
  );
  return state;
});

// Update TEI on DHIS2
each(
  $.newPatientUuid,
  upsert(
    'trackedEntityInstances',
    {
      ou: $.orgUnit,
      program: $.program,
      filter: [`${$.dhis2PatientNumberAttributeId}:Eq:${$.data.patient_number}`],
    },
    state => {
      const payload = {
        orgUnit: state.orgUnit,
        program: state.program,
        trackedEntityType: 'cHlzCA2MuEF',
        attributes: [
          {
            attribute: `${state.dhis2PatientNumberAttributeId}`,
            value: `${state.data.patient_number}`,
          }, //DHIS2 patient number to use as lookup key
          { attribute: 'AYbfTPYMNJH', value: `${state.data.uuid}` }, //OMRS patient uuid
          {
            attribute: `${state.openmrsAutoIdAttributeId}`,
            value: `${state.data.omrs_patient_number.identifier}`,
          }, //id generated in wf1-2 e.g., "IQ146-24-000-027"
        ],
      }

      console.log('final payload to send to dhis2:', payload)
      return payload; 
    }
  )
    // {
    //   orgUnit: $.orgUnit,
    //   program: $.program,
    //   trackedEntityType: 'cHlzCA2MuEF',
    //   attributes: [
    //     {
    //       attribute: `${$.dhis2PatientNumberAttributeId}`,
    //       value: `${state.data.patient_number}`,
    //     }, //DHIS2 patient number to use as lookup key
    //     { attribute: 'AYbfTPYMNJH', value: `${state.data.uuid}` }, //OMRS patient uuid
    //     {
    //       attribute: `${state.openmrsAutoIdAttributeId}`,
    //       value: `${state.data.omrs_patient_number.identifier}`,
    //     }, //id generated in wf1-2 e.g., "IQ146-24-000-027"
    //   ],
    // },
);
