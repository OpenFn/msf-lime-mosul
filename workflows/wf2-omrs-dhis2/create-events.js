// Create or update events for each encounter
create(
  "tracker",
  {
    events: (state) => {
      console.log(
        "Creating events for: ",
        JSON.stringify(state.eventsMapping, null, 2)
      );
      return state.eventsMapping;
    },
  },
  {
    params: {
      async: false,
      dataElementIdScheme: "UID",
      importStrategy: "CREATE_AND_UPDATE",
    },
  }
);

const findlatestAnswer = (encounters, conceptUuid) => {
  const latestAnswer = encounters.reduce((acc, e) => {
    const answer = e.obs.find((o) => o.concept.uuid === conceptUuid);
    if (answer) {
      const personUuid = answer.person.uuid;
      if (
        !acc[personUuid] ||
        new Date(answer.obsDatetime) > new Date(acc[personUuid].obsDatetime)
      ) {
        acc[personUuid] = answer;
      }
    }
    return acc;
  }, {});

  return latestAnswer;
};

fn((state) => {
  const {
    encounters,
    TEIs,
    program,
    orgUnit,
    optsMap,
    // Lighten state by removing unused properties
    formMaps,
    optionSetKey,
    eventsMapping,
    // encounterUuids,
    formUuids,
    references,
    ...next
  } = state;

  const genderMap = optsMap
    .filter((o) => o["DHIS2 DE UID"] === "qptKDiv9uPl")
    .reduce((acc, obj) => {
      acc[obj["value.display - Answers"]] = obj["DHIS2 Option Code"];
      return acc;
    }, {});

  const teiMapping = {};
  const latestGenderUpdate = findlatestAnswer(
    encounters,
    "ec42d68d-3e23-43de-b8c5-a03bb538e7c7"
  );

  if (latestGenderUpdate) {
    const [personUuid, answer] = Object.entries(latestGenderUpdate).flat();
    const { trackedEntity } = TEIs[personUuid] || {};
    if (!trackedEntity) {
      console.log("No TEI found for person", personUuid);
      return;
    }
    if (!teiMapping[trackedEntity]) {
      teiMapping[trackedEntity] = {
        program,
        orgUnit,
        trackedEntity,
        attributes: [],
      };
    }
    const attribues = [
      {
        attribute: "qptKDiv9uPl", //gender
        value: genderMap[answer.value.display],
      },
      {
        attribute: "AYbfTPYMNJH", //OpenMRS Patient UID to use to upsert TEI
        value: personUuid,
      },
    ];
    teiMapping[trackedEntity].attributes.push(...attribues);
  }

  const latestEducationUpdate = findlatestAnswer(
    encounters,
    "cc3a5a7a-abfe-4630-b0c0-c1275c6cbb54"
  );

  if (latestEducationUpdate) {
    const [personUuid, answer] = Object.entries(latestEducationUpdate).flat();
    const { trackedEntity } = TEIs[personUuid] || {};
    if (!trackedEntity) {
      console.log("No TEI found for person", personUuid);
      return;
    }
    if (!teiMapping[trackedEntity]) {
      teiMapping[trackedEntity] = {
        program,
        orgUnit,
        trackedEntity,
        attributes: [],
      };
    }
    const attribues = [
      {
        attribute: "Dggll4f9Efj", //education
        value: optsMap.find(
          (o) => o["value.display - Answers"] === answer.value.display
        )?.["DHIS2 Option Code"], //map to DHIS2 Option Code in optsMap
      },
    ];

    teiMapping[trackedEntity].attributes.push(...attribues);
  }

  const partnerMissingUpdate = findlatestAnswer(
    encounters,
    "783a300d-5624-4202-90c6-91660a779cab"
  );

  if (partnerMissingUpdate) {
    const [personUuid, answer] = Object.entries(partnerMissingUpdate).flat();
    const { trackedEntity } = TEIs[personUuid] || {};
    if (!trackedEntity) {
      console.log("No TEI found for person", personUuid);
      return;
    }
    if (answer.value.display === "Yes") {
      if (!teiMapping[trackedEntity]) {
        teiMapping[trackedEntity] = {
          program,
          orgUnit,
          trackedEntity,
          attributes: [],
        };
      }
      const attribues = [
        {
          attribute: "FpuGAOu6itZ",
          value: "Partner left/missing",
        },
        {
          attribute: "cUUwuY8Uc5c",
          value: "partner_left",
        },
      ];
      teiMapping[trackedEntity].attributes.push(...attribues);
    }
  }

  return { ...next, teisToUpdate: Object.values(teiMapping) };
});

fnIf(
  (state) => state.teisToUpdate.length === 0,
  ({ lastRunDateTime }) => ({ lastRunDateTime })
);
