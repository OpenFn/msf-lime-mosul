create(
  "tracker",
  { trackedEntities: (state) => Object.values(state.childTeis) },
  {
    params: {
      atomicMode: "ALL",
      async: false,
    },
  }
);

fn((state) => {
  state.upsertedTeis =
    state.data.bundleReport.typeReportMap.TRACKED_ENTITY.objectReports.map(
      (report) => report.uid
    );
  return state;
});

each($.upsertedTeis, get(`tracker/trackedEntities/${$.data}`).then(state => {
  const { trackedEntity, enrollments, attributes } = state.data || {};

  const patientUuid = attributes.find(a => a.attribute === 'AYbfTPYMNJH').value

  state.childTeis ??= {};
  state.childTeis[patientUuid] = {
    trackedEntity,
    events: enrollments?.[0]?.events,
    enrollment: enrollments?.[0]?.enrollment,
  };

  return state;
}))
