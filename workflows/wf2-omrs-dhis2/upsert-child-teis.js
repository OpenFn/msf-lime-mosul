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

each(
  $.upsertedTeis,
  get(`tracker/trackedEntities/${$.data}`, {
    fields: "*",
  }).then((state) => {
    const {
      trackedEntity,
      programOwners,
      enrollments,
      attributes,
      events,
      orgUnit,
    } = state.data || {};

    const program = programOwners.find(
      (po) => po.trackedEntity === trackedEntity && po.orgUnit === orgUnit
    )?.program;

    const patientUuid = attributes.find(
      (a) => a.attribute === "AYbfTPYMNJH"
    ).value;

    state.childTeis ??= {};
    state.childTeis[patientUuid] = {
      trackedEntity,
      events: enrollments?.[0]?.events ?? events,
      enrollment: enrollments?.[0]?.enrollment,
      orgUnit,
      program,
    };

    return state;
  })
);
