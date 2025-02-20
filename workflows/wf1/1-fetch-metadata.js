cursor($.manualCursor || $.lastRunDateTime).then(state => {
  console.log('Date cursor to filter TEI extract ::', state.cursor);
  return state;
});

cursor('now', {
  key: 'lastRunDateTime',
  format: c => {
    const offset = 2; // GMT+2 (Geneva time)
    c.setHours(c.getHours() + offset);
    return c.toISOString().replace('Z', '');
  },
}).then(state => {
  console.log('Next sync start date:', state.lastRunDateTime);
  return state;
});

// get(
//   'https://raw.githubusercontent.com/OpenFn/msf-lime-metadata/refs/heads/collections/metadata/mapping.json',
//   { parseAs: 'json' },
//   state => {
//     const { cursor, lastRunDateTime, data } = state;

//     return { ...data, cursor, lastRunDateTime };
//   }
// );

collections.get('metadata-mappings', 'mappingSets').then(state => {
  const { cursor, lastRunDateTime, data } = state;
  if (Object.keys(data).length === 0) {
    throw new Error('Empty collection');
  }
  return { ...data, cursor, lastRunDateTime };
});

fn(({ identifiers, optsMap, formMaps, formMetadata, ...state }) => {
  state.genderOptions = {
    male: 'M',
    female: 'F',
    unknown: 'U',
    transgender_female: 'O',
    transgender_male: 'O',
    prefer_not_to_answer: 'O',
    gender_variant_non_conforming: 'O',
  };
  state.orgUnit = identifiers.find(i => i.type === 'ORG_UNIT')?.[
    'dhis2 attribute id'
  ];
  state.program = identifiers.find(i => i.type === 'PROGRAM')?.[
    'dhis2 attribute id'
  ];
  state.nationalityMap = optsMap
    .filter(o => o['DHIS2 DE full name'] === 'Nationality')
    .reduce((acc, value) => {
      acc[value['DHIS2 Option Code']] = value['value.uuid - External ID'];
      return acc;
    }, {});

  state.statusMap = optsMap
    .filter(o => o['DHIS2 DE full name'].includes(' status'))
    .reduce((acc, value) => {
      acc[value['DHIS2 Option Code']] = value['value.uuid - External ID'];
      return acc;
    }, {});

  state.patientAttributes = formMaps.patient.dataValueMap;

  state.dhis2PatientNumber = identifiers.find(
    i => i.type === 'DHIS2_PATIENT_NUMBER'
  )?.['omrs identifierType']; //DHIS2 ID or DHIS2 Patient Number

  state.dhis2PatientNumberAttributeId = identifiers.find(
    i => i.type === 'DHIS2_PATIENT_NUMBER'
  )?.['dhis2 attribute id']; //DHIS2 ID or DHIS2 Patient Number

  state.openmrsAutoId = identifiers.find(i => i.type === 'OPENMRS_AUTO_ID')?.[
    'omrs identifierType'
  ]; //MSF ID or OpenMRS Patient Number

  state.openmrsAutoIdAttributeId = identifiers.find(
    i => i.type === 'OPENMRS_AUTO_ID'
  )?.['dhis2 attribute id']; //MSF ID or OpenMRS Patient Number

  return state;
});
