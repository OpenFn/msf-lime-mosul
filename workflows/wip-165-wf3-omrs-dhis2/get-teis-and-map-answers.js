const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const teiByPatientUuid = (patientUuid, teis) => {
  return teis.find((tei) => {
    const omrsPatientUuid = tei.attributes.find(
      ({ attribute }) => attribute === "AYbfTPYMNJH"
    )?.value;

    return omrsPatientUuid === patientUuid;
  });
};

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
        ...tei,
        enrollment: tei.enrollments[0]?.enrollment,
      };
    } else {
      console.log("Parent TEI Not Found for Patient:", patientUuid);
    }
  });

  return state;
});

fn((state) => {
  state.ouProgramTeis = state.latestEncountersByVisit.reduce((acc, obj) => {
    const formUuid = obj.form.uuid;
    // const patientUuid = obj.patient.uuid;
    const patientNumber = obj.patient.display.split(" - ")[0];
    const orgUnit = state.formMaps[formUuid].orgUnit;
    const program = state.formMaps[formUuid].programId;
    const key = `${orgUnit}-${program}`;
    if (!acc[key]) {
      acc[key] = {
        orgUnit,
        program,
        patientNumbers: [patientNumber],
      };
    }
    if (!acc[key].patientNumbers.includes(patientNumber)) {
      acc[key].patientNumbers.push(patientNumber);
    }

    return acc;
  }, {});

  return state;
});

each(
  (state) => Object.values(state.ouProgramTeis),
  get("tracker/events", (state) => {
    const { orgUnit, program, patientNumbers } = state.data;
    return {
      orgUnit,
      program,
      filter: [`Pi1zytYdq6l:IN:${patientNumbers.join(";")}`],
      fields: "*",
    };
  }).then((state) => {
    const { orgUnit, program } = state.references.at(-1);
    state.eventsByPatient ??= {};
    const grouped = state.data.instances.reduce((acc, event) => {
      const patientNumber = event.dataValues.find(
        (dv) => dv.dataElement === "Pi1zytYdq6l"
      )?.value;

      if (!acc[patientNumber]) {
        acc[patientNumber] = [];
      }
      acc[patientNumber].push({
        event: event.event,
        occuredAt: event.occuredAt,
      });
      return acc;
    }, {});
    state.eventsByPatient[`${orgUnit}-${program}`] = grouped;
    return state;
  })
);
