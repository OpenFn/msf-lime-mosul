const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

//TODO: Group the encounters by patient and then get the TEI for each patient
each(
  $.encounters,
  get("tracker/trackedEntities", (state) => ({
    orgUnit: $.orgUnit,
    program: $.program,
    // orgUnit: state.formMaps[state.data.form.uuid].orgUnit, //TODO: the org unit and program should be fetched from fromMap by mapping encounter.form.uuid
    // program: state.formMaps[state.data.form.uuid].programId, //TODO: the org unit and program should be fetched from fromMap by mapping encounter.form.uuid
    filter: [`AYbfTPYMNJH:Eq:${$.data.patient.uuid}`],
    fields: "*,enrollments[*],enrollments[events[*]], attributes[*]",
  })).then(async (state) => {
    const encounter = state.references.at(-1);
    console.log(encounter.patient.uuid, "Encounter patient uuid");

    const { trackedEntity, enrollments, attributes } =
      state.data?.instances?.[0] || {};
    if (trackedEntity && enrollments) {
      state.TEIs ??= {};
      state.TEIs[encounter.patient.uuid] = {
        trackedEntity,
        events: enrollments[0]?.events,
        enrollment: enrollments[0]?.enrollment,
        attributes,
      };
    }

    await delay(2000);
    return state;
  })
);
