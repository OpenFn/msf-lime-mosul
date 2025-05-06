// Fetch all encounters
http
  .get('/ws/fhir2/R4/Encounter', {
    query: { _count: 100, _lastUpdated: `ge${$.cursor}` },
  })
  .then(state => {
    const { link, total } = state.data;
    state.nextUrl = link
      .find(l => l.relation === 'next')
      ?.url.replace(/(_count=)\d+/, `$1${total}`)
      .split('/openmrs')[1];

    state.allResponse = state.data;
    return state;
  });

fnIf(
  $.nextUrl,
  http.get($.nextUrl).then(state => {
    console.log(`Fetched ${state.data.entry.length} remaining encounters`);
    delete state.allResponse.link;
    state.allResponse.entry.push(...state.data.entry);
    return state;
  })
);

fn(state => {
  console.log(
    'Total # of encounters fetched: ',
    state.allResponse?.entry?.length
  );
  state.encounterUuids = state.allResponse?.entry?.map(p => p.resource.id);
  state.patientUuids = [
    ...new Set(
      state.allResponse?.entry?.map(p =>
        p.resource.subject.reference.replace('Patient/', '')
      )
    ),
  ];

  return state;
});

// Fetch patient encounters
each(
  $.patientUuids,
  get('encounter', { patient: $.data, v: 'full' }).then(state => {
    const patientUuid = state.references.at(-1);
    const filteredEncounters = state.formUuids
      .map(formUuid =>
        state.data.results.filter(
          e => e.encounterDatetime >= state.cursor && e?.form?.uuid === formUuid
        )
      )
      .flat();

    // TODO: Ask AK Why are we picking the first encounter?
    // const encounters = filteredEncounters.map(e => e[0]).filter(e => e);
    const encounters = filteredEncounters.filter(Boolean).flat();
    state.encounters ??= [];
    state.encounters.push(...encounters);

    console.log(
      encounters.length,
      `# of filtered encounters found in OMRS for ${patientUuid}`
    );

    return state;
  })
);

fnIf($.encounters, state => {
  const {
    data,
    index,
    response,
    references,
    allResponse,
    patientUuids,
    ...next
  } = state;
  console.log(next.encounters.length, '# of new encounters to sync to dhis2');

  return next;
});

fnIf(!$.encounters, state => {
  console.log('No encounters found for cursor: ', state.cursor);
  return state;
});
