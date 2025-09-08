const patientMapping = (omrsPatient, mappingConfig) => {
  const genderMap = {
    M: 'male',
    O: 'unknown',
    F: 'female',
    U: 'unknown',
  };
  const {
    orgUnit,
    program,
    optsMap,
    formMaps,
    placeOflivingMap,
    patientProgramStage,
    dhis2PatientNumber,
    openmrsAutoId,
  } = mappingConfig;

  const dateCreated = omrsPatient.auditInfo.dateCreated.substring(0, 10);
  const findIdentifierByUuid = (identifiers, targetUuid) =>
    identifiers.find(i => i.identifierType.uuid === targetUuid)?.identifier;

  const enrollments = [
    {
      orgUnit,
      program,
      programStage: patientProgramStage, //'MdTtRixaC1B',
      enrollmentDate: dateCreated,
    },
  ];

  const findOptsUuid = uuid =>
    omrsPatient.person.attributes.find(a => a.attributeType.uuid === uuid)
      ?.value?.uuid ||
    omrsPatient.person.attributes.find(a => a.attributeType.uuid === uuid)
      ?.value;

  const findOptCode = optUuid =>
    optsMap.find(o => o['value.uuid - External ID'] === optUuid)?.[
      'DHIS2 Option Code'
    ];

  const patientMap = formMaps.patient.dataValueMap;
  const statusAttrMaps = Object.keys(patientMap).map(d => {
    const optUid = findOptsUuid(patientMap[d]);
    return {
      attribute: d,
      value: findOptCode(optUid) || optUid,
    };
  });

  const standardAttr = [
    {
      attribute: 'fa7uwpCKIwa',
      value: omrsPatient.person?.names[0]?.givenName,
    },
    {
      attribute: 'Jt9BhFZkvP2',
      value: omrsPatient.person?.names[0]?.familyName,
    },
    {
      attribute: 'P4wdYGkldeG', //DHIS2 ID ==> "Patient Number"
      value:
        findIdentifierByUuid(omrsPatient.identifiers, dhis2PatientNumber) ||
        findIdentifierByUuid(omrsPatient.identifiers, openmrsAutoId), //map OMRS ID if no DHIS2 id
    },
    {
      attribute: 'ZBoxuExmxcZ', //MSF ID ==> "OpenMRS Patient Number"
      value: findIdentifierByUuid(omrsPatient.identifiers, openmrsAutoId),
    },
    {
      attribute: 'AYbfTPYMNJH', //"OpenMRS Patient UID"
      value: omrsPatient.uuid,
    },

    {
      attribute: 'T1iX2NuPyqS',
      value: omrsPatient.person.age,
    },
    {
      attribute: 'WDp4nVor9Z7',
      value: omrsPatient.person.birthdate?.slice(0, 10),
    },
    {
      attribute: 'rBtrjV1Mqkz', //Place of living
      value: placeOflivingMap[omrsPatient.person?.addresses[0]?.cityVillage],
    },
  ];

  //filter out attributes that don't have a value from dhis2
  const filteredAttr = standardAttr.filter(a => a.value);
  const filteredStatusAttr = statusAttrMaps.filter(a => a.value);

  const payload = {
    uuid: omrsPatient.uuid,
    query: {
      ou: orgUnit,
      program,
      filter: [`AYbfTPYMNJH:Eq:${omrsPatient.uuid}`], //upsert on omrs.patient.uid
    },
    data: {
      program,
      orgUnit,
      trackedEntityType: 'cHlzCA2MuEF',
      attributes: [...filteredAttr, ...filteredStatusAttr],
    },
  };
  payload.data.attributes.push({
    attribute: 'qptKDiv9uPl',
    value: genderMap[omrsPatient.person.gender],
  });

  payload.data.enrollments = enrollments;

  // console.log('mapped dhis2 payloads:: ', JSON.stringify(payload, null, 2));

  return payload;
};

collections.get('mosul-metadata-mappings-staging').then(state => {
  state.optsMap = state.data
    .filter(i => i.key.includes('optsMap-value-'))
    .map(i => i.value);

  state.identifiers = state.data
    .filter(i => i.key.includes('identifiers-value-'))
    .map(i => i.value);
  state.syncedAt = state.data.find(i => i.key === 'syncedAt')?.value;
  state.formMetadata = state.data.find(i => i.key === 'formMetadata')?.value;
  state.placeOflivingMap = state.data.find(
    i => i.key === 'placeOflivingMap'
  )?.value;
  state.sourceFile = state.data.filter(i => i.key === 'sourceFile')?.[0]?.value;
  state.fileDateModified = state.data.filter(
    i => i.key === 'fileDateModified'
  )?.[0]?.value;
  state.formMaps = state.data.find(i => i.key === 'formMaps')?.value;

  delete state.data;
  delete state.references;
  return state;
});

fn(state => {
  const isValidUUID = id => {
    if (!id || typeof id !== 'string') return false;

    const UUID_PATTERN =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return UUID_PATTERN.test(id);
  };

  const { formMetadata, identifiers, ...next } = state;

  next.v2FormUuids = formMetadata
    .filter(
      form =>
        isValidUUID(form['OMRS form.uuid']) &&
        form['OMRS Form Version'] === 'v4-2025'
    )
    .map(form => form['OMRS form.uuid']);
  next.formUuids = formMetadata
    .filter(
      form => isValidUUID(form['OMRS form.uuid']) && form['Workflow'] === 'WF2'
    )
    .map(form => form['OMRS form.uuid']);

  next.patientProgramStage = 'vN61drMkGqO';

  next.orgUnit = identifiers.find(i => i.type === 'ORG_UNIT')?.[
    'dhis2 attribute id'
  ];

  next.program = identifiers.find(i => i.type === 'PROGRAM')?.[
    'dhis2 attribute id'
  ];
  // next.patientProgramStage = state.formMaps.patient.programStage;

  next.dhis2PatientNumber = identifiers.find(
    i => i.type === 'DHIS2_PATIENT_NUMBER'
  )?.['omrs identifierType']; //DHIS2 ID or DHIS2 Patient Number

  next.openmrsAutoId = identifiers.find(i => i.type === 'OPENMRS_AUTO_ID')?.[
    'omrs identifierType'
  ]; //MSF ID or OpenMRS Patient Number

  return next;
});

fn(state => {
  const {
    patients,
    optsMap,
    formMaps,
    placeOflivingMap,
    patientProgramStage,
    dhis2PatientNumber,
    openmrsAutoId,
    ...next
  } = state;

  next.patients = patients.map(patient =>
    patientMapping(patient, {
      orgUnit: next.orgUnit,
      program: next.program,
      optsMap,
      formMaps,
      placeOflivingMap,
      patientProgramStage,
      dhis2PatientNumber,
      openmrsAutoId,
    })
  );

  return next;
});
