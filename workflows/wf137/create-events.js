// Create or update events for each encounter
create(
  'tracker',
  {
    events: state => {
      console.log(
        'Creating events for: ',
        JSON.stringify(state.eventsMapping, null, 2)
      );
      return state.eventsMapping;
    },
  },
  {
    params: {
      async: false,
      dataElementIdScheme: 'UID',
      importStrategy: 'CREATE_AND_UPDATE',
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
        acc[personUuid] = { ...answer, formUuid: e.form.uuid };
      }
    }
    return acc;
  }, {});

  return Object.values(latestAnswer);
};

fn((state) => {
  const {
    encounters,
    childTeis,
    parentTeis,
    program,
    orgUnit,
    optsMap,
    // Lighten state by removing unused properties
    formMaps,
    optionSetKey,
    eventsMapping,
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

  const latestGenderUpdate = findlatestAnswer(
    encounters,
    "ec42d68d-3e23-43de-b8c5-a03bb538e7c7"
  );

  const genderUpdated = latestGenderUpdate
    .map((answer) => {
      const parentTei = parentTeis[answer?.person?.uuid].trackedEntity
      const childTei = childTeis[answer?.person?.uuid].trackedEntity

      const mappings = [];
      const sharedMapping = {
        trackedEntityType: "cHlzCA2MuEF",
        attributes: [
          {
            attribute: "qptKDiv9uPl", //gender
            value: genderMap[answer.value.display],
          },
          {
            attribute: "AYbfTPYMNJH", //OpenMRS Patient UID to use to upsert TEI
            value: answer.person.uuid,
          },
        ],
      };
      if (!childTei) {
        console.log("No TEI found for person", answer.person.uuid);
      }
      if (childTei) {
        mappings.push({
          ...sharedMapping,
          trackedEntity: childTei,
          program: formMaps[answer.formUuid].programId,
          orgUnit: formMaps[answer.formUuid].orgUnit,
        });
      }
      if (parentTei) {
        mappings.push({
          ...sharedMapping,
          trackedEntity: parentTei,
          program,
          orgUnit,
        });
      }
      return mappings
    })
    .filter(Boolean)
    .flat();

  const latestEducationUpdate = findlatestAnswer(
    encounters,
    "cc3a5a7a-abfe-4630-b0c0-c1275c6cbb54"
  );

  // console.log({ latestEducationUpdate })
  const educationUpdated = latestEducationUpdate
    .map((answer) => {
      const parentTei = parentTeis[answer?.person?.uuid]?.trackedEntity
      const childTei = childTeis[answer?.person?.uuid]?.trackedEntity
      console.log({ parentTei, childTei })
      const mappings = []
      const sharedMapping = {
        trackedEntityType: "cHlzCA2MuEF",
        attributes: [
          {
            attribute: "Dggll4f9Efj", //education
            value: optsMap.find(
              (o) => o["value.display - Answers"] === answer.value.display
            )?.["DHIS2 Option Code"], //map to DHIS2 Option Code in optsMap
          },
        ],
      }
      if (!childTei) {
        console.log("No TEI found for person", answer.person.uuid);
      }

      if (parentTei) {
        mappings.push({
          trackedEntity: parentTei,
          program,
          orgUnit,
          ...sharedMapping
        })
      }
      if (childTei) {
        mappings.push({
          trackedEntity: childTei,
          program: formMaps[answer.formUuid].programId,
          orgUnit: formMaps[answer.formUuid].orgUnit,
          ...sharedMapping
        })
      }

      return mappings
    })
    .filter(Boolean)
    .flat();

  return {
    ...next,
    teisToUpdate: [...genderUpdated, ...educationUpdated],
  };
});

fnIf(
  (state) => state.teisToUpdate.length === 0,
  ({ lastRunDateTime }) => ({ lastRunDateTime })
);
