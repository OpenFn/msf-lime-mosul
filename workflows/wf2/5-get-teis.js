const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

//TODO: Group the encounters by patient and then get the TEI for each patient
each(
  $.encounters,
  get('tracker/trackedEntities', {
    orgUnit: $.orgUnit,
    program: $.program,
    filter: [`AYbfTPYMNJH:Eq:${$.data.patient.uuid}`],
    fields: '*,enrollments[*],enrollments[events[*]]',
  }).then(async state => {
    const encounter = state.references.at(-1);
    console.log(encounter.patient.uuid, 'Encounter patient uuid');

    const { trackedEntity, enrollments } = state.data?.instances?.[0] || {};
    if (trackedEntity && enrollments) {
      state.TEIs ??= {};
      state.TEIs[encounter.patient.uuid] = {
        trackedEntity,
        events: enrollments[0]?.events,
        enrollment: enrollments[0]?.enrollment,
      };
    }

    await delay(2000);
    return state;
  })
);
