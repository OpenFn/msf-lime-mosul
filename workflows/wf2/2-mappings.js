const isValidUUID = id => {
  if (!id || typeof id !== 'string') return false;

  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return UUID_PATTERN.test(id);
};

// get(
//   'https://raw.githubusercontent.com/OpenFn/msf-lime-metadata/refs/heads/collections/metadata/collections.json',
//   { parseAs: 'json' },
//   state => {
//     const { cursor, lastRunDateTime, patients, data } = state;

//     return {
//       ...data,
//       cursor,
//       patients,
//       lastRunDateTime,
//     };
//   }
// );

collections.get('metadata-mappings', 'mappingSets').then(state => {
  const { cursor, lastRunDateTime, patients, data } = state;
  if (Object.keys(data).length === 0) {
    throw new Error('Empty collection');
  }
  return { ...data, cursor, patients, lastRunDateTime };
});

fn(state => {
  const { formMetadata, identifiers, ...rest } = state;

  rest.formUuids = formMetadata
    .filter(form => isValidUUID(form['OMRS form.uuid']))
    .map(form => form['OMRS form.uuid']);

  rest.orgUnit = identifiers.find(i => i.type === 'ORG_UNIT')?.[
    'dhis2 attribute id'
  ];
  rest.program = identifiers.find(i => i.type === 'PROGRAM')?.[
    'dhis2 attribute id'
  ];

  rest.patientProgramStage = state.formMaps.patient.programStage;

  rest.dhis2PatientNumber = identifiers.find(
    i => i.type === 'DHIS2_PATIENT_NUMBER'
  )?.['omrs identifierType']; //DHIS2 ID or DHIS2 Patient Number

  rest.openmrsAutoId = identifiers.find(i => i.type === 'OPENMRS_AUTO_ID')?.[
    'omrs identifierType'
  ]; //MSF ID or OpenMRS Patient Number

  return rest;
});

fn(state => {
  state.genderOptions = state.optsMap
    .filter(o => o['OptionSet name'] === 'Sex - Patient')
    .reduce((acc, value) => {
      acc[value['value.uuid - External ID']] = value['DHIS2 Option Code'];
      return acc;
    }, {});

  return state;
});
