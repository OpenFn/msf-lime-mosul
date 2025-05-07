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

const v2FormUuids = [
  '9287bc3e-5852-3034-a59b-889d06d546ad',
  'dfd11c31-c253-3ace-866a-0be0bc827f75',
  '6b87b1cd-b52f-35ba-b7e9-7adc7c7ada5b',
  '3abb648b-1a0b-390c-b1e6-ade4aa08d849',
  '7e600a1c-22b8-3127-b7e6-1829dee17f8a',
  '8843775f-651c-3be2-ab51-8de299268c74',
];
// Fetch patient encounters
each(
  $.patientUuids,
  get('encounter', { patient: $.data, v: 'full' }).then(state => {
    state.allEncounters ??= [];
    state.allEncounters.push(
      ...state.data.results.filter(e => v2FormUuids.includes(e?.form?.uuid))
    );

    const patientUuid = state.references.at(-1);
    const filteredEncounters = state.formUuids.map(formUuid =>
      state.data.results.filter(
        e => e.encounterDatetime >= state.cursor && e?.form?.uuid === formUuid
      )
    );

    const encounters = filteredEncounters.map(e => e[0]).filter(e => e);
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
    ...next
  } = state;

  if (next.encounters?.length) {
    console.log(next.encounters.length, '# of new encounters to sync to dhis2');
  } else {
    console.log('No encounters found for cursor: ', next.cursor);
  }

  return next;
});
