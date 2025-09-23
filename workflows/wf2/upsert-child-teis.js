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

fn((state) => {
  // Reduce childTeis to only the trackedEntity, events, and enrollment
  state.childTeis = Object.entries(state.childTeis).reduce(
    (acc, [patientUuid, tei]) => {
      acc[patientUuid] = {
        trackedEntity: tei.trackedEntity,
        events: tei.enrollments[0]?.events,
        enrollment: tei.enrollments[0]?.enrollment,
      };
      return acc;
    },
    {}
  );

  return state;
});

// fnIf($.childTeis && $.parentTeis, (state) => {
//   const { childTeis, parentTeis } = state;
//   state.relationshipsMapping = Object.keys(childTeis)
//     .map((uuid) => {
//       const childTei = childTeis[uuid].trackedEntity;
//       const parentTei = parentTeis[uuid].trackedEntity;

//       if (childTei != parentTei) {
//         return {
//           from: {
//             trackedEntityInstance: {
//               trackedEntityInstance: parentTei,
//             },
//           },
//           to: {
//             trackedEntityInstance: {
//               trackedEntityInstance: childTei,
//             },
//           },
//           relationshipType: "cJJTZ51EK24", //TODO: Need to change this hardcoded id, because it will be different for d/t programs
//         };
//       }
//     })
//     .filter(Boolean);
//   return state;
// });
