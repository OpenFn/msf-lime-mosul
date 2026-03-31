const logEventUrl = (baseUrl, objectReports) => {
  objectReports.forEach((event) => {
    console.log(`${baseUrl}/api/40/tracker/events/${event.uid}`);
  });
};

const buildEventsUrl = (baseUrl, { program, orgUnit }) => {
  return `${baseUrl}/dhis-web-capture/index.html#/?orgUnitId=${orgUnit}&programId=${program}`;
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
        const [program, orgUnit] = key.split("-");

        const eventsUrl = buildEventsUrl(baseUrl, { program, orgUnit });

        console.log({ events, eventsUrl });
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
).then((state) => {
  const baseUrl = state.configuration.hostUrl;
  logEventUrl(
    baseUrl,
    state.data?.bundleReport?.typeReportMap?.EVENT?.objectReports || []
  );

  return state;
});

fn(({ lastRunDateTime }) => ({ lastRunDateTime }));
