// Create or update events for each encounter create(
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

fn(({ lastRunDateTime }) => ({ lastRunDateTime }));
