function chunk(array, size) {
  if (size <= 0) return [];

  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

get('tracker/trackedEntities', {
  orgUnit: $.orgUnit,
  program: $.program,
  filter: state => [
    `AYbfTPYMNJH:Eq:47d5c786-c5e2-4824-9403-409b9faadadb}`,
  ],
}).then(state => {
  // console.log(state.data);
  state.foundTeis ??= [];
  state.foundTeis.push(...state.data.instances);
  return state;
})


fn(state => {
  const { foundTeis, patients, ...next } = state;
  const foundTeisByPatient = foundTeis.reduce((acc, tei) => {
    acc[
      tei.trackedEntity.attributes.find(
        a => a.attribute === 'AYbfTPYMNJH'
      ).value
    ] = tei;
    return acc;
  }, {});

  next.patientsToUpsert = patients.map(patient => {
    if (foundTeisByPatient[patient.uuid]) {
      delete patient.data.enrollments;
      const attributes = patient.data.attributes.filter(
        a => a.attribute !== 'qptKDiv9uPl'
      );
      patient.data.attributes = attributes;
    }
    return patient;
  });
  return next;
});

// get('tracker/trackedEntities', {
//   orgUnit: $.orgUnit,
//   program: $.program,
//   filter: state => [
//     `AYbfTPYMNJH:IN:${state.patients
//       .slice(0, 10)
//       .map(p => p.uuid)
//       .join(';')}`,
//   ],
// }).then(state => {
//   console.log(state.data);
//   state.teis = state.data.instances;
//   return state;
// });
// const buildPatientsUpsert = (omrsPatient, teiData, mappingConfig) => {
//   const genderMap = {
//     M: "male",
//     O: "unknown",
//     F: "female",
//     U: "unknown",
//   };
//   const {
//     orgUnit,
//     program,
//     optsMap,
//     formMaps,
//     placeOflivingMap,
//     patientProgramStage,
//     dhis2PatientNumber,
//     openmrsAutoId,
//   } = mappingConfig;

//   const isNewPatient = teiData.length === 0;
//   const dateCreated = omrsPatient.auditInfo.dateCreated.substring(0, 10);
//   const findIdentifierByUuid = (identifiers, targetUuid) =>
//     identifiers.find((i) => i.identifierType.uuid === targetUuid)?.identifier;

//   const enrollments = [
//     {
//       orgUnit,
//       program,
//       programStage: patientProgramStage, //'MdTtRixaC1B',
//       enrollmentDate: dateCreated,
//     },
//   ];

//   const findOptsUuid = (uuid) =>
//     omrsPatient.person.attributes.find((a) => a.attributeType.uuid === uuid)
//       ?.value?.uuid ||
//     omrsPatient.person.attributes.find((a) => a.attributeType.uuid === uuid)
//       ?.value;

//   const findOptCode = (optUuid) =>
//     optsMap.find((o) => o["value.uuid - External ID"] === optUuid)?.[
//     "DHIS2 Option Code"
//     ];

//   const patientMap = formMaps.patient.dataValueMap;
//   const statusAttrMaps = Object.keys(patientMap).map((d) => {
//     const optUid = findOptsUuid(patientMap[d]);
//     return {
//       attribute: d,
//       value: findOptCode(optUid) || optUid,
//     };
//   });

//   const standardAttr = [
//     {
//       attribute: "fa7uwpCKIwa",
//       value: omrsPatient.person?.names[0]?.givenName,
//     },
//     {
//       attribute: "Jt9BhFZkvP2",
//       value: omrsPatient.person?.names[0]?.familyName,
//     },
//     {
//       attribute: "P4wdYGkldeG", //DHIS2 ID ==> "Patient Number"
//       value:
//         findIdentifierByUuid(omrsPatient.identifiers, dhis2PatientNumber) ||
//         findIdentifierByUuid(omrsPatient.identifiers, openmrsAutoId), //map OMRS ID if no DHIS2 id
//     },
//     {
//       attribute: "ZBoxuExmxcZ", //MSF ID ==> "OpenMRS Patient Number"
//       value: findIdentifierByUuid(omrsPatient.identifiers, openmrsAutoId),
//     },
//     {
//       attribute: "AYbfTPYMNJH", //"OpenMRS Patient UID"
//       value: omrsPatient.uuid,
//     },

//     {
//       attribute: "T1iX2NuPyqS",
//       value: omrsPatient.person.age,
//     },
//     {
//       attribute: "WDp4nVor9Z7",
//       value: omrsPatient.person.birthdate?.slice(0, 10),
//     },
//     {
//       attribute: "rBtrjV1Mqkz", //Place of living
//       value: placeOflivingMap[omrsPatient.person?.addresses[0]?.cityVillage],
//     },
//   ];

//   //filter out attributes that don't have a value from dhis2
//   const filteredAttr = standardAttr.filter((a) => a.value);
//   const filteredStatusAttr = statusAttrMaps.filter((a) => a.value);

//   const payload = {
//     query: {
//       ou: orgUnit,
//       program,
//       filter: [`AYbfTPYMNJH:Eq:${omrsPatient.uuid}`], //upsert on omrs.patient.uid
//     },
//     data: {
//       program,
//       orgUnit,
//       trackedEntityType: "cHlzCA2MuEF",
//       attributes: [...filteredAttr, ...filteredStatusAttr],
//     },
//   };

//   // console.log('mapped dhis2 payloads:: ', JSON.stringify(payload, null, 2));

//   if (isNewPatient) {
//     payload.data.attributes.push({
//       attribute: "qptKDiv9uPl",
//       value: genderMap[omrsPatient.person.gender],
//     });
//     console.log("create enrollment");
//     payload.data.enrollments = enrollments;
//   }

//   return payload;
// };

// const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// each(
//   $.patients,
//   get("tracker/trackedEntities", {
//     orgUnit: $.orgUnit,
//     filter: [`AYbfTPYMNJH:Eq:${$.data?.uuid}`],
//     program: $.program,
//   }).then(async (state) => {
//     const patient = state.references.at(-1);
//     console.log(patient.uuid, "patient uuid");

//     const patientMapping = buildPatientsUpsert(patient, state.data.instances, {
//       placeOflivingMap: state.placeOflivingMap,
//       orgUnit: state.orgUnit,
//       program: state.program,
//       patientProgramStage: state.patientProgramStage,
//       formMaps: state.formMaps,
//       optsMap: state.optsMap,
//       dhis2PatientNumber: state.dhis2PatientNumber,
//       openmrsAutoId: state.openmrsAutoId,
//     });
//     state.patientsUpsert ??= [];
//     state.patientsUpsert.push(patientMapping);

//     await delay(2000);
//     return state;
//   })
// );

// // Upsert TEIs to DHIS2
// each(
//   $.patientsUpsert,
//   upsert("trackedEntityInstances", $.data.query, (state) => {
//     console.log(state.data.data);
//     return state.data.data;
//   })
// );
// fn((state) => {
//   const {
//     data,
//     response,
//     references,
//     patients,
//     patientsUpsert,
//     placeOflivingMap,
//     identifiers,
//     ...next
//   } = state;
//   next.patientUuids = patients.map(p => p.uuid);
//   return next;
// });
