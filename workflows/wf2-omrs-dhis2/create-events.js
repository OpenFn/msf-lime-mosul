const buildTeiUrl = (baseUrl, { trackedEntity, program, orgUnit }) => {
  return `${baseUrl}/dhis-web-tracker-capture/index.html#/dashboard?tei=${trackedEntity}&program=${program}&ou=${orgUnit}`;
};
// Create or update events for each encounter
create(
  "tracker",
  {
    events: (state) => {
      const baseUrl = state.configuration.hostUrl;

      const groupedEvents = state.eventsMapping.reduce((acc, event) => {
        const { trackedEntity, program, orgUnit } = event;
        const key = `${trackedEntity}-${program}-${orgUnit}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(event);
        return acc;
      }, {});
      Object.entries(groupedEvents).forEach(([key, events]) => {
        const [trackedEntity, program, orgUnit] = key.split("-");

        const teiUrl = buildTeiUrl(baseUrl, {
          trackedEntity,
          program,
          orgUnit,
        });

        console.log({ events, teiUrl });
      });
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
      const chilProgram = formMaps[answer.formUuid].programId;
      const childOrgUnit = formMaps[answer.formUuid].orgUnit;
      const personUuid = answer.person.uuid;
      const parentTei = parentTeis[personUuid].trackedEntity;
      const childTei =
        childTeis[`${childOrgUnit}-${chilProgram}-${personUuid}`].trackedEntity;

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
          trackedEntityInstance: childTei,
          program: chilProgram,
          orgUnit: childOrgUnit,
        });
      }
      if (parentTei) {
        mappings.push({
          ...sharedMapping,
          trackedEntityInstance: parentTei,
          program,
          orgUnit,
        });
      }
      return mappings;
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
      const chilProgram = formMaps[answer.formUuid].programId;
      const childOrgUnit = formMaps[answer.formUuid].orgUnit;
      const personUuid = answer.person.uuid;
      const parentTei = parentTeis[personUuid]?.trackedEntity;
      const childTei =
        childTeis[`${childOrgUnit}-${chilProgram}-${personUuid}`]
          ?.trackedEntity;
      console.log({ parentTei, childTei });
      const mappings = [];
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
      };
      if (!childTei) {
        console.log("No TEI found for person", answer.person.uuid);
      }

      if (parentTei) {
        mappings.push({
          trackedEntityInstance: parentTei,
          program,
          orgUnit,
          ...sharedMapping,
        });
      }
      if (childTei) {
        mappings.push({
          trackedEntityInstance: childTei,
          program: chilProgram,
          orgUnit: childOrgUnit,
          ...sharedMapping,
        });
      }

      return mappings;
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
