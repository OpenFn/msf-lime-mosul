const buildTeiUrl = (baseUrl, { trackedEntity, program, orgUnit }) => {
  return `${baseUrl}/dhis-web-tracker-capture/index.html#/dashboard?tei=${trackedEntity}&program=${program}&ou=${orgUnit}`;
};

const buildEventsUrl = (baseUrl, { program, orgUnit }) => {
  return `${baseUrl}/dhis-web-capture/index.html#/?orgUnitId=${orgUnit}&programId=${program}`
}
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
        const eventsUrl = buildEventsUrl(baseUrl, { program, orgUnit })

        console.log({ events, teiUrl, eventsUrl });
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
fn(({ lastRunDateTime }) => ({ lastRunDateTime }));
