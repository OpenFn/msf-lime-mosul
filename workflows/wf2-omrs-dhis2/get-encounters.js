// Fetch patient encounters
each(
  $.patientUuids,
  get('encounter', { patient: $.data, v: 'full' }).then(state => {
    state.allEncounters ??= [];
    state.allEncounters.push(
      // v2FormsUuids are for mental health forms
      // ...state.data.results.filter(e =>
      //   state.v2FormUuids.includes(e?.form?.uuid)
      // )
      ...state.data.results.filter(e =>
        state.formUuids.includes(e?.form?.uuid)
      )
    );

    const patientUuid = state.references.at(-1);
    const filteredEncounters = state.formUuids.map(formUuid =>
      state.data.results
        .filter(
          e =>
            e.auditInfo.dateCreated >= state.cursor &&
            e?.form?.uuid === formUuid
        )
        .sort(
          (a, b) =>
            new Date(b.auditInfo.dateCreated) -
            new Date(a.auditInfo.dateCreated)
        )
    );

    const encounters = filteredEncounters.map(pe => {
      const isLatestForm = pe.find(e => {
        return state.formMaps[e?.form?.uuid]?.syncType === 'latest'
      })
      if (isLatestForm) {
        return [isLatestForm]
      } else {
        const allPatientEncounter = pe.filter(e => state.formMaps[e?.form?.uuid]?.syncType === 'all')
        return allPatientEncounter
      }
    }).flat()

    state.encounters ??= [];
    state.encounters.push(...encounters);

    console.log(
      encounters.length,
      `# of filtered encounters found in OMRS for ${patientUuid}`
    );

    return state;
  })
);

fn(state => {
  const {
    data,
    index,
    response,
    references,
    allResponse,
    patientUuids,
    patients,
    ...next
  } = state;

  if (next.encounters?.length) {
    next.encounters = next.encounters.map(
      ({ uuid, patient, obs, form, encounterDatetime }) => ({
        uuid,
        patient,
        obs,
        form,
        encounterDatetime,
      })
    )
    console.log(next.encounters.length, '# of new encounters to sync to dhis2');
  } else {
    console.log('No encounters found for cursor: ', next.cursor);
  }
  next.allEncounters = next.allEncounters?.map(
    ({ uuid, patient, obs, form, encounterDatetime }) => ({
      uuid,
      patient,
      obs,
      form,
      encounterDatetime,
    })
  );

  return next;
});
