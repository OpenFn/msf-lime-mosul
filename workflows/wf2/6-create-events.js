// Create or update events for each encounter
create(
  'tracker',
  {
    events: state => {
      console.log(
        'Creating events for: ',
        JSON.stringify(state.encountersMapping, null, 2)
      );
      return state.encountersMapping;
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

fn(state => {
  const latestGenderUpdate = state.encounters.reduce((acc, e) => {
    const answer = e.obs.find(
      o => o.concept.uuid === 'ec42d68d-3e23-43de-b8c5-a03bb538e7c7'
    );
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

  state.genderUpdated = Object.values(latestGenderUpdate);

  return state;
});

fnIf(
  state => state.genderUpdated.length === 0,
  ({ lastRunDateTime }) => ({ lastRunDateTime })
);
