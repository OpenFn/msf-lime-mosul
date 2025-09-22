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

// each(
//   (state) => {
//     return state?.teisToCreate ? Object.entries(state?.teisToCreate) : [];
//   },
//   create("trackedEntityInstances", (state) => {
//     const payload = state.data[1];
//     return payload;
//   }).then((state) => {
//     const [patient, payload] = state.references.at(-1);
//     const trackedEntity = state.data?.response?.importSummaries[0]?.reference;
//     state.childTeis ??= {};
//     state.createdTeis ??= [];
//     state.createdTeis.push(trackedEntity);
//     state.childTeis[patient] = { trackedEntity };
//     return state;
//   })
// );

// each(
//   $?.createdTeis || [],
//   get(`tracker/trackedEntities/${$.data}`, {
//     fields: "attributes[*],enrollments,trackedEntity",
//   }).then((state) => {
//     const { trackedEntity, enrollments, attributes } = state.data || {};
//     console.log(state.data);
//     const patientUuid = attributes.find(
//       (a) => a.attribute === "AYbfTPYMNJH"
//     ).value;

//     console.log("Fetched Teis", state.data);
//     state.childTeis ??= {};
//     state.childTeis[patientUuid] = {
//       trackedEntity,
//       events: enrollments?.[0]?.events,
//       enrollment: enrollments?.[0]?.enrollment,
//     };

//     return state;
//   })
// );

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
