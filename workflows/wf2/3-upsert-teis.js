const buildPatientsUpsert = (globals, dhis2Config, patient) => {
  const { placeOflivingMap, genderOptions, formMaps, optsMap } = globals;
  const dateCreated = patient.auditInfo.dateCreated.substring(0, 10);
  const findIdentifierByUuid = (identifiers, targetUuid) =>
    identifiers.find((i) => i.identifierType.uuid === targetUuid)?.identifier;

  const findOptsUuid = (uuid) =>
    patient.person.attributes.find((a) => a.attributeType.uuid === uuid)?.value
      ?.uuid ||
    patient.person.attributes.find((a) => a.attributeType.uuid === uuid)?.value;

  const findOptCode = (optUuid) =>
    optsMap.find((o) => o["value.uuid - External ID"] === optUuid)?.[
    "DHIS2 Option Code"
    ];

  const patientMap = formMaps.patient.dataValueMap;
  const statusAttrMaps = Object.keys(patientMap).map((d) => {
    const optUid = findOptsUuid(patientMap[d]);
    return {
      attribute: d,
      value: findOptCode(optUid) || optUid,
    };
  });

  const omrsId = findIdentifierByUuid(
    patient.identifiers,
    dhis2Config.openmrsAutoId
  );
  const standardAttr = [
    {
      attribute: "fa7uwpCKIwa",
      value: patient.person?.names[0]?.givenName,
    },
    {
      attribute: "Jt9BhFZkvP2",
      value: patient.person?.names[0]?.familyName,
    },
    {
      attribute: "P4wdYGkldeG", //DHIS2 ID ==> "Patient Number"
      value:
        findIdentifierByUuid(
          patient.identifiers,
          dhis2Config.dhis2PatientNumber
        ) || omrsId, //map OMRS ID if no DHIS2 id
    },
    {
      attribute: "ZBoxuExmxcZ", //MSF ID ==> "OpenMRS Patient Number"
      value: omrsId,
    },
    {
      attribute: "AYbfTPYMNJH", //"OpenMRS Patient UID"
      value: patient.uuid,
    },
    {
      attribute: "qptKDiv9uPl",
      value: genderOptions[patient.person.gender],
    },
    {
      attribute: "T1iX2NuPyqS",
      value: patient.person.age,
    },
    {
      attribute: "WDp4nVor9Z7",
      value: patient.person.birthdate?.slice(0, 10),
    },
    {
      attribute: "rBtrjV1Mqkz", //Place of living
      value: placeOflivingMap[patient.person?.addresses[0]?.cityVillage],
    },
  ];

  //filter out attributes that don't have a value from dhis2
  const filteredAttr = standardAttr.filter((a) => a.value);
  const filteredStatusAttr = statusAttrMaps.filter((a) => a.value);
  //console.log('standardAttr ::', JSON.stringify(standardAttr, null,2))
  //console.log('filteredAttr ::', JSON.stringify(filteredAttr, null,2))

  const payload = {
    query: {
      ou: dhis2Config.orgUnit,
      program: dhis2Config.program,
      filter: [`AYbfTPYMNJH:Eq:${patient.uuid}`], //upsert on omrs.patient.uid
    },
    data: {
      program: dhis2Config.program,
      orgUnit: dhis2Config.orgUnit,
      trackedEntityType: "cHlzCA2MuEF",
      attributes: [...filteredAttr, ...filteredStatusAttr],
    },
  };

  // console.log('mapped dhis2 payloads:: ', JSON.stringify(payload, null, 2));

  if (patient.isNewPatient) {
    console.log("create enrollment");
    const enrollments = [
      {
        orgUnit: dhis2Config.orgUnit,
        program: dhis2Config.program, // searching by MH program but change this EMR
        programStage: dhis2Config.patientProgramStage, //'MdTtRixaC1B',
        enrollmentDate: dateCreated,
      },
    ];
    payload.data.enrollments = enrollments;
  }

  return payload;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

each(
  $.patients,
  get(
    "tracker/trackedEntities",
    {
      orgUnit: $.orgUnit,
      filter: [`AYbfTPYMNJH:Eq:${$.data?.uuid}`],
      program: $.program,
    },
    {},
    async (state) => {
      const {
        placeOflivingMap,
        genderOptions,
        formMaps,
        optsMap,
        program,
        orgUnit,
        openmrsAutoId,
        dhis2PatientNumber,
        patientProgramStage,
      } = state;
      const globals = { placeOflivingMap, genderOptions, formMaps, optsMap };
      const dhis2Config = {
        orgUnit,
        program,
        openmrsAutoId,
        dhis2PatientNumber,
        patientProgramStage,
      };
      const patient = state.references.at(-1);
      console.log(patient.uuid, "patient uuid");
      patient.isNewPatient = state.data.instances.length === 0;

      const parentMapping = buildPatientsUpsert(globals, dhis2Config, patient);
      // const childMapping = buildPatientsUpsert()
      state.patientsUpsert ??= [];
      state.patientsUpsert.push(parentMapping);
      await delay(2000);
      return state;
    }
  )
);

// Upsert TEIs to DHIS2
each(
  $.patientsUpsert,
  upsert('trackedEntityInstances', $.data.query, $.data.data)
);
fn(state => {
  const {
    data,
    response,
    references,
    patients,
    patientsUpsert,
    placeOflivingMap,
    genderOptions,
    identifiers,
    ...next
  } = state;

  next.patientUuids = patients.map(p => p.uuid);
  return next;
});
