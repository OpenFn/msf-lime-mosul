function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

const buildTeiMapping = (omrsPatient, patientTei, mappingConfig) => {
  const genderMap = {
    M: "male",
    O: "unknown",
    F: "female",
    U: "unknown",
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

  const enrolledAt = omrsPatient.auditInfo.dateCreated.substring(0, 10);
  const findIdentifierByUuid = (identifiers, targetUuid) =>
    identifiers.find((i) => i.identifierType.uuid === targetUuid)?.identifier;

  const findAttrValue = (uuid) => {
    return omrsPatient.person.attributes.find(
      (a) => a.attributeType.uuid === uuid
    )?.value;
  };

  const findOptCodeByUuid = (uuid) => {
    return optsMap.find((o) => o["value.uuid - External ID"] === uuid)?.[
      "DHIS2 Option Code"
    ];
  };

  const findOptCode = (attrValue) => {
    if (typeof attrValue === "string") {
      return findOptCodeByUuid(attrValue);
    }
    if (typeof attrValue === "object") {
      const { uuid, display } = attrValue;
      const optCodeByDisplay = optsMap.find(
        (o) =>
          o["value.uuid - External ID"] === uuid &&
          o["value.display - Answers"] === display
      )?.["DHIS2 Option Code"];

      return optCodeByDisplay ?? findOptCodeByUuid(uuid);
    }
    return null;
  };

  const patientMap = formMaps.patient.dataValueMap;
  const statusAttrMaps = Object.keys(patientMap).map((d) => {
    const attrValue = findAttrValue(patientMap[d]);

    return {
      attribute: d,
      value: findOptCode(attrValue) || attrValue,
    };
  });

  const standardAttr = [
    {
      attribute: "fa7uwpCKIwa",
      value: omrsPatient.person?.names[0]?.givenName,
    },
    {
      attribute: "Jt9BhFZkvP2",
      value: omrsPatient.person?.names[0]?.familyName,
    },
    {
      attribute: "P4wdYGkldeG", //DHIS2 ID ==> "Patient Number"
      value:
        findIdentifierByUuid(omrsPatient.identifiers, dhis2PatientNumber) ||
        findIdentifierByUuid(omrsPatient.identifiers, openmrsAutoId), //map OMRS ID if no DHIS2 id
    },
    {
      attribute: "ZBoxuExmxcZ", //MSF ID ==> "OpenMRS Patient Number"
      value: findIdentifierByUuid(omrsPatient.identifiers, openmrsAutoId),
    },
    {
      attribute: "AYbfTPYMNJH", //"OpenMRS Patient UID"
      value: omrsPatient.uuid,
    },

    {
      attribute: "T1iX2NuPyqS",
      value: omrsPatient.person.age,
    },
    {
      attribute: "WDp4nVor9Z7",
      value: omrsPatient.person.birthdate?.slice(0, 10),
    },
    {
      attribute: "rBtrjV1Mqkz", //Place of living
      value: placeOflivingMap[omrsPatient.person?.addresses[0]?.cityVillage],
    },
  ];

  //filter out attributes that don't have a value from dhis2
  const filteredAttr = standardAttr.filter((a) => a.value);
  const filteredStatusAttr = statusAttrMaps.filter((a) => a.value);

  const payload = {
    program,
    orgUnit,
    attributes: [...filteredAttr, ...filteredStatusAttr],
  };
  // console.log('mapped dhis2 payloads:: ', JSON.stringify(payload, null, 2));
  const enrollments = [
    {
      orgUnit,
      program,
      enrolledAt,
      programStage: patientProgramStage, //'MdTtRixaC1B',
    },
  ];

  if (!patientTei) {
    payload.trackedEntityType = "cHlzCA2MuEF";

    payload.attributes.push({
      attribute: "qptKDiv9uPl",
      value: genderMap[omrsPatient.person.gender],
    });
    console.log("create enrollment");
    payload.enrollments = enrollments;
  }

  if (patientTei) {
    payload.trackedEntity = patientTei.trackedEntity;
    payload.trackedEntityType = patientTei.trackedEntityType;
  }

  return payload;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

each(
  (state) => chunkArray(state.patients, 200),
  get("tracker/trackedEntities", {
    orgUnit: $.orgUnit,
    filter: (state) => [
      `AYbfTPYMNJH:IN:${state.data.map((patient) => patient.uuid).join(";")}`,
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
  const findTeiByUuid = (patientUuid) => {
    return state.foundTrackedEntities.find((tei) => {
      return (
        tei.attributes.find(
          (attribute) => attribute.attribute === "AYbfTPYMNJH"
        )?.value === patientUuid
      );
    });
  };

  state.patientsMapping = state.patients.map((patient) => {
    const patientTei = findTeiByUuid(patient.uuid);

    return buildTeiMapping(patient, patientTei, {
      placeOflivingMap: state.placeOflivingMap,
      orgUnit: state.orgUnit,
      program: state.program,
      patientProgramStage: state.patientProgramStage,
      formMaps: state.formMaps,
      optsMap: state.optsMap,
      dhis2PatientNumber: state.dhis2PatientNumber,
      openmrsAutoId: state.openmrsAutoId,
    });
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
    identifiers,
    ...next
  } = state;
  next.patientUuids = patients.map((p) => p.uuid);
  return next;
});
