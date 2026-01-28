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

  const encountersPatient = Object.keys(state.encountersByPatient);
  encountersPatient.forEach((patientUuid) => {
    const parentTei = findTeiByPatientUuid(patientUuid, state.data.instances);
    const patientOuProgram = `${state.orgUnit}-${state.program}-${patientUuid}`;
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
    const orgUnit = state.formMaps[formUuid]?.orgUnit;
    const program = state.formMaps[formUuid]?.programId;
    const relationshipType = state.formMaps[formUuid]?.relationshipId;
    const encounterKey = `${orgUnit}-${program}`;
    const parentKey = `${state.orgUnit}-${state.program}`;
    if (parentKey !== encounterKey) {
      if (!acc[encounterKey]) {
        acc[encounterKey] = {
          orgUnit,
          program,
          relationshipType,
          patientUuids: [patientUuid],
        };
      }

      if (!acc[encounterKey].patientUuids.includes(patientUuid)) {
        acc[encounterKey].patientUuids.push(patientUuid);
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
      state.currChildTeis ??= {};
      state.childTeisToCreate ??= {};
      const { orgUnit, program, patientUuids, relationshipType } =
        state.references.at(-1);

      patientUuids.forEach((patientUuid) => {
        const tei = findTeiByPatientUuid(
          patientUuid,
          state.data.instances,
          program,
          orgUnit
        );

        const patientOuProgram = `${orgUnit}-${program}-${patientUuid}`;
        if (tei?.trackedEntity) {
          console.log("Child TEI found:", tei.trackedEntity);
          state.currChildTeis[patientOuProgram] = {
            ...tei,
            relationshipType,
            orgUnit,
            program,
          };
        }
        if (!tei?.trackedEntity) {
          console.log("Child TEI not found for patient:", patientUuid);
          const parentTei =
            state?.parentTeis[
              `${state.orgUnit}-${state.program}-${patientUuid}`
            ];
          state.childTeisToCreate[patientOuProgram] = {
            relationshipType,
            trackedEntityType: parentTei?.trackedEntityType || "cHlzCA2MuEF",
            enrollments: [
              {
                orgUnit,
                program,
                enrolledAt: new Date().toISOString().split("T")[0],
                attributes: parentTei?.attributes.filter((attribute) =>
                  [
                    "P4wdYGkldeG", //DHIS2 ID ==> "Patient Number"
                  ].includes(attribute.attribute)
                ),
              },
            ],
            attributes: parentTei?.attributes || [],
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
