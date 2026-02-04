function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function remainderMonths(dob, ageYears, todayDate) {
  const birth = new Date(dob);
  const today = new Date(todayDate);

  // Date when the person turned `ageYears`
  const birthdayAtAge = new Date(
    birth.getFullYear() + ageYears,
    birth.getMonth(),
    birth.getDate()
  );

  let months =
    (today.getFullYear() - birthdayAtAge.getFullYear()) * 12 +
    (today.getMonth() - birthdayAtAge.getMonth());

  // Adjust if today's day is before birth day
  if (today.getDate() < birthdayAtAge.getDate()) {
    months -= 1;
  }

  return months;
}

const findIdentifierByUuid = (identifiers, targetUuid) =>
  identifiers.find((i) => i.identifierType.uuid === targetUuid)?.identifier;

const findAttrValue = (uuid, attributes) => {
  return attributes.find((a) => a.attributeType.uuid === uuid)?.value;
};

const findOptCode = (attrValue, optsMap, optionSetKey) => {
  if (typeof attrValue === "string") {
    return attrValue;
  }
  if (typeof attrValue === "object") {
    const { uuid, display } = attrValue;

    const optionKey = `patient-${uuid}`;
    const matchingOptionSet = optionSetKey[optionKey];
    const optCodeByExtId = optsMap.find(
      (o) =>
        o["value.uuid - External ID"] === uuid &&
        o["DHIS2 Option Set UID"] === matchingOptionSet
    )?.["DHIS2 Option Code"];

    if (optCodeByExtId) {
      return optCodeByExtId;
    }
    const optCodeByDisplayAndExtId = optsMap.find(
      (o) =>
        o["value.uuid - External ID"] === uuid &&
        o["value.display - Answers"] === display
    )?.["DHIS2 Option Code"];

    return optCodeByDisplayAndExtId;
  }
  return null;
};
const buildTeiMapping = (omrsPatient, patientTei, mapConfig) => {
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
    optionSetKey,
    formMaps,
    placeOflivingMap,
    patientProgramStage,
    dhis2PatientNumber,
    openmrsAutoId,
    dhis2Map,
  } = mapConfig;

  const enrolledAt = omrsPatient.auditInfo.dateCreated.substring(0, 10);

  const patientMap = formMaps.patient.dataValueMap;
  const statusAttrMaps = Object.keys(patientMap).map((d) => {
    const attrValue = findAttrValue(
      patientMap[d],
      omrsPatient.person.attributes
    );
    return {
      attribute: d,
      value: findOptCode(attrValue, optsMap, optionSetKey),
    };
  });

  const standardAttr = [
    {
      attribute: dhis2Map.attr.ageInMonth,
      value: remainderMonths(
        omrsPatient.person.birthdate,
        omrsPatient.person.age,
        new Date()
      ),
    },
    {
      attribute: dhis2Map.attr.firstName,
      value: omrsPatient.person?.names[0]?.givenName,
    },
    {
      attribute: dhis2Map.attr.lastName,
      value: omrsPatient.person?.names[0]?.familyName,
    },
    {
      attribute: dhis2Map.attr.patientNumber,
      value:
        findIdentifierByUuid(omrsPatient.identifiers, dhis2PatientNumber) ||
        findIdentifierByUuid(omrsPatient.identifiers, openmrsAutoId), //map OMRS ID if no DHIS2 id
    },
    {
      attribute: dhis2Map.attr.omrsPatientNumber,
      value: findIdentifierByUuid(omrsPatient.identifiers, openmrsAutoId),
    },
    {
      attribute: dhis2Map.attr.omrsPatientUuid,
      value: omrsPatient.uuid,
    },

    {
      attribute: dhis2Map.attr.ageInYears,
      value: omrsPatient.person.age,
    },
    {
      attribute: dhis2Map.attr.birthdate,
      value: omrsPatient.person.birthdate?.slice(0, 10),
    },
    {
      attribute: dhis2Map.attr.placeOflivingMap,
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
      attribute: dhis2Map.attr.sex,
      value: genderMap[omrsPatient.person.gender],
    });
    // console.log("create enrollment");
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
  (state) => chunkArray(state.patientUuids, 100),
  get("tracker/trackedEntities", {
    orgUnit: $.orgUnit,
    filter: (state) => [
      `${state.dhis2Map.attr.omrsPatientUuid}:IN:${state.data.join(";")}`,
    ],
    program: $.program,
    fields: "*",
  }).then((state) => {
    state.foundTrackedEntities ??= [];
    state.foundTrackedEntities.push(...state.data.instances);
    return state;
  })
);

const findTeiByUuid = (patientUuid, teis, omrsPatientUuid) => {
  return teis.find((tei) => {
    return (
      tei.attributes.find(
        (attribute) => attribute.attribute === omrsPatientUuid
      )?.value === patientUuid
    );
  });
};
fn((state) => {
  state.patientsMapping = state.patients.map((patient) => {
    const patientTei = findTeiByUuid(
      patient.uuid,
      state.foundTrackedEntities,
      state.dhis2Map.attr.omrsPatientUuid
    );

    const mapConfig = {
      placeOflivingMap: state.placeOflivingMap,
      orgUnit: state.orgUnit,
      program: state.program,
      patientProgramStage: state.patientProgramStage,
      formMaps: state.formMaps,
      optsMap: state.optsMap,
      optionSetKey: state.optionSetKey,
      dhis2PatientNumber: state.dhis2PatientNumber,
      openmrsAutoId: state.openmrsAutoId,
      dhis2Map: state.dhis2Map,
    };
    return buildTeiMapping(patient, patientTei, mapConfig);
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
    ...next
  } = state;

  return next;
});
