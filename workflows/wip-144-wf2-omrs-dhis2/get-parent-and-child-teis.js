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

fn((state) => {
  state.parentTeis ??= {};
  state.missingParentTeis ??= {};

  Object.keys(state.encountersByPatient).forEach((patientUuid) => {
    const parentTei = teiByPatientUuid(patientUuid, state.data.instances);
    if (parentTei?.trackedEntity) {
      console.log("Parent TEI found:", parentTei.trackedEntity);

      state.parentTeis[patientUuid] = {
        trackedEntity: parentTei.trackedEntity,
        attributes: parentTei.attributes,
        trackedEntityType: parentTei.trackedEntityType,
        enrollments: parentTei.enrollments,
      };
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
      fields: "*",
    };
  })
    .then((state) => {
      state.childTeis ??= {};
      state.encounters.forEach((encounter) => {
        const patientUuid = encounter.patient.uuid;
        const program = state.formMaps[encounter.form.uuid].programId;
        const orgUnit = state.formMaps[encounter.form.uuid].orgUnit;

        const tei = state.data.instances.find((tei) => {
          const omrsPatientUuid = tei.attributes.find(
            (attribute) => attribute.attribute === "AYbfTPYMNJH"
          )?.value;
          const teiProgram = tei.programOwners.find(
            (po) => po.trackedEntity === tei.trackedEntity
          )?.program;

          return (
            omrsPatientUuid === patientUuid &&
            teiProgram === program &&
            tei.orgUnit === orgUnit
          );
        });

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

        if (!tei && !state.childTeis[patientOuProgram]) {
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
