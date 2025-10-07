const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const patientUid = "d464433d-41d5-482f-808c-7fe364847352"
//TODO: Group the encounters by patient and then get the TEI for each patient
get('tracker/trackedEntities', state => ({
  orgUnit: "sUpt0j2GmBD",
  program: "dWdzxMuKa8Z",
  // orgUnit: state.formMaps[state.data.form.uuid].orgUnit, //TODO: the org unit and program should be fetched from fromMap by mapping encounter.form.uuid
  // program: state.formMaps[state.data.form.uuid].programId, //TODO: the org unit and program should be fetched from fromMap by mapping encounter.form.uuid
  filter: [`AYbfTPYMNJH:Eq:${patientUid}`],
  fields: '*,enrollments[*],enrollments[events[*]], attributes[*]',
})).then(async state => {
  
  console.log(patientUid, 'Encounter patient uuid');

  const { trackedEntity, enrollments, attributes } = state.data?.instances?.[0] || {};
  if (trackedEntity && enrollments) {
    state.TEIs ??= {};
    state.TEIs[patientUid] = {
      trackedEntity,
      events: enrollments[0]?.events,
      enrollment: enrollments[0]?.enrollment,
      attributes
    };
  }

  await delay(2000);
  return state;
})
