export const teiByPatientUuid = (patientUuid, teis) => {
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
    const { orgUnit, program } = state.data;
    return {
      orgUnit,
      program,
      fields: "*",
    };
  }).then((state) => {
    const { orgUnit, program, patientNumbers } = state.references.at(-1);
    state.eventsByPatient ??= {};
    const grouped = state.data.instances?.reduce((acc, event) => {
      const PATIENT_NUMBER_DE = new Set([
        "Pi1zytYdq6l", // F09
        "fnH6H3biOkE", // F24
        "kcSuQKfU5Zo", // F26
        "ci9C72RjN8Z", // F28
        "gHPt2FCZEE6", // F43
        "j855dPp9p18", // F64
        "ipRL5PApBZk", // F66
        "KVIidg9rDcd", // F67
      ]);

      const patientNumber = event.dataValues.find((dv) =>
        PATIENT_NUMBER_DE.has(dv.dataElement)
      )?.value;
      if (!patientNumber || !patientNumbers.includes(patientNumber)) {
        return acc;
      }
      const visitUuid = event.dataValues.find(
        (dv) => dv.dataElement === "rbFVBI2N6Ex"
      )?.value;

      if (!acc[patientNumber]) {
        acc[patientNumber] = [];
      }
      acc[patientNumber].push({
        event: event.event,
        occuredAt: event.occuredAt,
        visitUuid,
      });
      return acc;
    }, {});
    console.log(
      `Processing ${state.data.instances?.length || 0} events for ${orgUnit}-${program}`
    );
    console.log(
      "Grouped events by patient:",
      Object.keys(grouped).length,
      "patients"
    );
    state.eventsByPatient[`${orgUnit}-${program}`] = grouped;
    return state;
  })
);
