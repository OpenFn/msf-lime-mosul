const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

fn((state) => {
  // Group encounters by patient UUID
  state.encountersByPatient = state.encounters.reduce((acc, obj) => {
    const key = obj.patient.uuid;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(obj);
    return acc;
  }, {});

  return state;
});

get("tracker/trackedEntities", {
  orgUnit: $.orgUnit,
  program: $.program,
  filter: (state) => [
    `AYbfTPYMNJH:IN:${Object.keys(state.encountersByPatient).join(";")}`,
  ],
});

const findTeiByUuid = (patientUuid, teis) => {
  return teis.find((tei) => {
    return (
      tei.attributes.find((attribute) => attribute.attribute === "AYbfTPYMNJH")
        ?.value === patientUuid
    );
  });
};
fn((state) => {
  state.parentTeis ??= {};
  state.missingParentTeis ??= {};

  Object.keys(state.encountersByPatient).forEach((patientUuid) => {
    const tei = findTeiByUuid(patientUuid, state.data.instances);
    if (tei?.trackedEntity) {
      console.log("Parent TEI found:", tei.trackedEntity);

      state.parentTeis[patientUuid] = tei;
    } else {
      console.log("Parent TEI Not Found for Patient:", patientUuid);
      state.missingParentTeis[patientUuid] =
        state.encountersByPatient[patientUuid];
    }
  });

  return state;
});

fn((state) => {
  state.ouProgramEncounters = state.encounters.reduce((acc, obj) => {
    const formUuid = obj.form.uuid;
    const patientUuid = obj.patient.uuid;
    const orgUnit = state.formMaps[formUuid].orgUnit;
    const program = state.formMaps[formUuid].programId;
    const key = `${orgUnit}-${program}`;
    if (!acc[key]) {
      acc[key] = {
        orgUnit,
        program,
        patientUuids: [patientUuid],
      };
    }
    if (!acc[key].patientUuids.includes(patientUuid)) {
      acc[key].patientUuids.push(patientUuid);
    }
    return acc;
  }, {});

  return state;
});

each(
  (state) => Object.values(state.ouProgramEncounters),
  get("tracker/trackedEntities", (state) => {
    const { orgUnit, program, patientUuids } = state.data;
    return {
      orgUnit,
      program,
      filter: [`AYbfTPYMNJH:IN:${patientUuids.join(";")}`],
      fields: "*,enrollments[*],enrollments[events[*]], relationships[*]",
    };
  })
);

fn((state) => {
  state.childTeis ??= {};
  // state.missingChildTeis ??= {};

  state.encounters.forEach((encounter) => {
    const patientUuid = encounter.patient.uuid;
    const tei = findTeiByUuid(patientUuid, state.data.instances);
    if (tei?.trackedEntity) {
      console.log("Child TEI found:", tei.trackedEntity);

      state.childTeis[patientUuid] = tei;
    }

    if (!tei && !state.childTeis[patientUuid]) {
      console.log("Child TEI not found for patient:", patientUuid);
      const { attributes, trackedEntityType } = state.parentTeis[patientUuid];
      const program = state.formMaps[encounter.form.uuid].programId;
      const orgUnit = state.formMaps[encounter.form.uuid].orgUnit;

      state.childTeis[patientUuid] = {
        trackedEntityType,
        enrollments: [
          {
            orgUnit,
            program,
            enrolledAt: new Date().toISOString().split("T")[0],
            attributes: attributes.filter(
              (attribute) => attribute.attribute == "P4wdYGkldeG"
            ),
          },
        ],
        attributes,
        orgUnit,
        program,
      };
    }
  });

  return state;
});

// fn((state) => {
//   const findFormUuid = (patientUuid) => {
//     return state.encounters.find(
//       (encounter) => encounter.patient.uuid === patientUuid
//     )?.form.uuid;
//   };

//   const missingTrackedEntities = state.encounters.filter(
//     (encounter) => !state.parentTeis[encounter.patient.uuid]
//   );

//   state.teisMapping = state.data.instances.map((instance) => {
//     const { trackedEntity, enrollments, trackedEntityType } = instance;
//     const patientUuid = instance.attributes.find(
//       (attribute) => attribute.attribute === "AYbfTPYMNJH"
//     )?.value;
//     if (trackedEntity) {
//       state.childTeis ??= {};
//       state.childTeis[patientUuid] = {
//         trackedEntity,
//         trackedEntityType,
//         events: enrollments?.[0]?.events,
//         enrollment: enrollments?.[0]?.enrollment,
//       };
//     } else {
//       state.teisToCreate ??= {};
//       const formUuid = findFormUuid(patientUuid);
//       const { attributes, trackedEntityType } = state.parentTeis[patientUuid];
//       const program = state.formMaps[formUuid].programId;
//       const orgUnit = state.formMaps[formUuid].orgUnit;

//       state.teisToCreate[patientUuid] = {
//         trackedEntityType,
//         enrollments: [
//           {
//             orgUnit,
//             program,
//             enrolledAt: new Date().toISOString().split("T")[0],
//           },
//         ],
//         attributes,
//         orgUnit,
//         program,
//       };
//     }
//   });

//   return state;
// });

// each(
//   $.encounters,
//   get("tracker/trackedEntities", (state) => ({
//     orgUnit: state.formMaps[state.data.form.uuid].orgUnit,
//     program: state.formMaps[state.data.form.uuid].programId,
//     filter: [`AYbfTPYMNJH:Eq:${state.data.patient.uuid}`],
//     fields: "*,enrollments[*],enrollments[events[*]], relationships[*]",
//   })).then(async (state) => {
//     const encounter = state.references.at(-1);
//     console.log(encounter.patient.uuid, "Encounter patient uuid");

//     const { trackedEntity, enrollments } = state.data?.instances?.[0] || {};
//     console.log({ trackedEntity, enrollments });

//     if (trackedEntity) {
//       state.childTeis ??= {};
//       state.childTeis[encounter.patient.uuid] = {
//         trackedEntity,
//         events: enrollments?.[0]?.events,
//         enrollment: enrollments?.[0]?.enrollment,
//       };
//     } else {
//       state.teisToCreate ??= {};
//       const { attributes, trackedEntityType } =
//         state.parentTeis[encounter.patient.uuid];
//       const program = state.formMaps[encounter.form.uuid].programId;
//       const orgUnit = state.formMaps[encounter.form.uuid].orgUnit;

//       state.teisToCreate[encounter.patient.uuid] = {
//         trackedEntityType,
//         enrollments: [
//           {
//             orgUnit,
//             program,
//             enrolledAt: new Date().toISOString().split("T")[0],
//           },
//         ],
//         attributes,
//         orgUnit,
//         program,
//       };
//     }

//     await delay(2000);
//     return state;
//   })
// );
