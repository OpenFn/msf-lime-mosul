create(
  "tracker",
  {
    trackedEntities: (state) => {
      const childTeis = Object.values(state.childTeisToCreate).map(
        ({ relationshipType, ...tei }) => {
          // Skip enrollment creation for program without registration
          if (tei.program === "od0M4kEn5Rp" && tei.enrollments) {
            const { enrollments, ...teiWithoutEnrollments } = tei;
            return teiWithoutEnrollments;
          }
          return tei;
        }
      );
      return childTeis;
    },
  },
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

    const relationshipType = Object.values(state.formMaps).find(
      (form) =>
        form.programId === program &&
        form.orgUnit === orgUnit &&
        form.formName !== "F00-Registration"
    )?.relationshipId;

    // Skip enrollment creation for program without registration
    const skipEnrollment = program === "od0M4kEn5Rp";

    state.createdChildTeis ??= {};
    const patientOuProgram = `${orgUnit}-${program}-${patientUuid}`;
    state.createdChildTeis[patientOuProgram] = {
      relationshipType,
      trackedEntity,
      events: enrollments?.[0]?.events ?? events,
      enrollments: skipEnrollment ? null : enrollments,
      attributes,
      orgUnit,
      program,
    };

    return state;
  })
);

fn((state) => {
  state.existingTeis = { ...state.existingTeis, ...state.createdChildTeis };
  return state;
});
