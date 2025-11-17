const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const teiByPatientUuid = (patientUuid, teis) => {
  return teis.find((tei) => {
    const omrsPatientUuid = tei.attributes.find(
      ({ attribute }) => attribute === "AYbfTPYMNJH"
    )?.value;

    return omrsPatientUuid === patientUuid;
  });
};

fn((state) => {
  state.encountersPatientUuids = [
    ...new Set(
      Object.values(state.encountersByVisit)
        .flat()
        .map((encounter) => encounter.patient.uuid)
    ),
  ];

  return state;
});

get("tracker/trackedEntities", {
  orgUnit: $.orgUnit,
  program: $.program,
  filter: (state) => [
    `AYbfTPYMNJH:IN:${state.encountersPatientUuids.join(";")}`,
  ],
  fields: "*",
});

fn((state) => {
  state.TEIs ??= {};
  state.encountersPatientUuids.forEach((patientUuid) => {
    const tei = teiByPatientUuid(patientUuid, state.data.instances);
    if (tei?.trackedEntity) {
      console.log("Parent TEI found:", tei.trackedEntity);

      state.TEIs[patientUuid] = {
        trackedEntity: tei.trackedEntity,
        attributes: tei.attributes,
        trackedEntityType: tei.trackedEntityType,
        enrollment: tei.enrollments[0]?.enrollment,
        events: tei.enrollments[0]?.events,
      };
    } else {
      console.log("Parent TEI Not Found for Patient:", patientUuid);
      state.missingParentTeis[patientUuid] =
        state.encountersByPatient[patientUuid];
    }
  });

  return state;
});

//TODO: Group the encounters by patient and then get the TEI for each patient
// each(
//   (state) => Object.values(state.encountersByVisit).flat(),
//   get("tracker/trackedEntities", (state) => ({
//     orgUnit: $.orgUnit,
//     program: $.program,
//     // orgUnit: state.formMaps[state.data.form.uuid].orgUnit, //TODO: the org unit and program should be fetched from fromMap by mapping encounter.form.uuid
//     // program: state.formMaps[state.data.form.uuid].programId, //TODO: the org unit and program should be fetched from fromMap by mapping encounter.form.uuid
//     filter: [`AYbfTPYMNJH:Eq:${$.data.patient.uuid}`],
//     fields: "*,enrollments[*],enrollments[events[*]], attributes[*]",
//   })).then(async (state) => {
//     const encounter = state.references.at(-1);
//     console.log(encounter.patient.uuid, "Encounter patient uuid");

//     const { trackedEntity, enrollments, attributes } =
//       state.data?.instances?.[0] || {};
//     if (trackedEntity && enrollments) {
//       state.TEIs ??= {};
//       state.TEIs[encounter.patient.uuid] = {
//         trackedEntity,
//         events: enrollments[0]?.events,
//         enrollment: enrollments[0]?.enrollment,
//         attributes,
//       };
//     }

//     await delay(2000);
//     return state;
//   })
// );
