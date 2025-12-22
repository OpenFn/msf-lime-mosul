const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const findTeiByPatientUuid = (
  patientUuid,
  teis,
  program = null,
  orgUnit = null
) => {
  return teis.find((tei) => {
    const omrsPatientUuid = tei.attributes.find(
      ({ attribute }) => attribute === "AYbfTPYMNJH"
    )?.value;

    if (omrsPatientUuid !== patientUuid) return false;

    if (program && orgUnit) {
      return tei.programOwners?.some(
        (po) => po.program === program && tei.orgUnit === orgUnit
      );
    }

    return true;
  });
};
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
  state.parentTeis ??= {};
  state.currChildTeis ??= {};
  state.missingParentTeis ??= {};
  state.childTeisToCreate ??= {};
  return state;
});
// Check if patient if exist in parent programs
get("tracker/trackedEntities", {
  orgUnit: $.orgUnit,
  program: $.program,
  filter: (state) => [
    `AYbfTPYMNJH:IN:${Object.keys(state.encountersByPatient).join(";")}`,
  ],
  fields:
    "trackedEntityType, orgUnit, trackedEntity, attributes, programOwners, enrollments",
});

fn((state) => {
  state.parentTeis ??= {};
  state.missingParentTeis ??= {};

  Object.keys(state.encountersByPatient).forEach((patientUuid) => {
    const parentTei = findTeiByPatientUuid(patientUuid, state.data.instances);
    if (parentTei?.trackedEntity) {
      console.log("Parent TEI found:", parentTei.trackedEntity);

      state.parentTeis[patientOuProgram] = parentTei;
    } else {
      console.log("Parent TEI Not Found for Patient:", patientUuid);
      state.missingParentTeis[patientOuProgram] =
        state.encountersByPatient[patientUuid];
    }
  });

  return state;
});

fn((state) => {
  state.childPrograms = state.encounters.reduce((acc, obj) => {
    const formUuid = obj.form.uuid;
    const patientUuid = obj.patient.uuid;
    const orgUnit = state.formMaps[formUuid].orgUnit;
    const program = state.formMaps[formUuid].programId;
    const key = `${orgUnit}-${program}`;
    const parentKey = `${state.orgUnit}-${state.program}`;
    if (parentKey !== key) {
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
    }

    return acc;
  }, {});

  return state;
});

// Search if child teis exists for each encounter
each(
  (state) => Object.values(state.childPrograms),
  get("tracker/trackedEntities", (state) => {
    const { orgUnit, program, patientUuids } = state.data;
    return {
      orgUnit,
      program,
      filter: [`AYbfTPYMNJH:IN:${patientUuids.join(";")}`],
      fields:
        "trackedEntityType, orgUnit, trackedEntity, attributes, programOwners, relationshipType, enrollments",
    };
  })
    .then((state) => {
      state.childTeis ??= {};
      state.encounters
        .filter((encounter) => {
          const program = state.formMaps[encounter.form.uuid].programId;
          const orgUnit = state.formMaps[encounter.form.uuid].orgUnit;
          return !(state.program === program && state.orgUnit === orgUnit);
        })
        .forEach((encounter) => {
          const patientUuid = encounter.patient.uuid;
          const program = state.formMaps[encounter.form.uuid].programId;
          const orgUnit = state.formMaps[encounter.form.uuid].orgUnit;

          const tei = findTeiByPatientUuid(
            patientUuid,
            state.data.instances,
            program,
            orgUnit
          );

          const patientOuProgram = `${orgUnit}-${program}-${patientUuid}`;
          const relationshipType =
            state.formMaps[encounter.form.uuid]?.relationshipId;

          if (tei?.trackedEntity) {
            console.log("Child TEI found:", tei.trackedEntity);
            state.childTeis[patientOuProgram] = {
              relationshipType,
              trackedEntity: tei.trackedEntity,
              attributes: tei.attributes,
              trackedEntityType: tei.trackedEntityType,
              enrollments: tei.enrollments,
              orgUnit,
              program,
            };
          }

          if (
            !tei &&
            !state.childTeis[patientOuProgram] &&
            !state.missingParentTeis[patientUuid]
          ) {
            console.log("Child TEI not found for patient:", patientUuid);
            const { attributes, trackedEntityType } =
              state?.parentTeis[patientUuid];

            state.childTeis[patientOuProgram] = {
              relationshipType,
              trackedEntityType,
              enrollments: [
                {
                  orgUnit,
                  program,
                  enrolledAt: new Date().toISOString().split("T")[0],
                  attributes: attributes.filter((attribute) =>
                    [
                      "P4wdYGkldeG", //DHIS2 ID ==> "Patient Number"
                    ].includes(attribute.attribute)
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
    })
    .then(async (state) => {
      await delay(2000);
      return state;
    })
);

fn((state) => {
  const { currChildTeis, parentTeis, ...next } = state;
  next.existingTeis = { ...currChildTeis, ...parentTeis };
  return next;
});
