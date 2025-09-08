const isValidUUID = id => {
  if (!id || typeof id !== 'string') return false;

  const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return UUID_PATTERN.test(id);
};

collections.get('mosul-metadata-mappings-staging').then(state => {
  const formMetadata = state.data.find(i => i.key === 'formMetadata')?.value;
  state.v2FormUuids = formMetadata
    .filter(
      form =>
        isValidUUID(form['OMRS form.uuid']) &&
        form['OMRS Form Version'] === 'v4-2025'
    )
    .map(form => form['OMRS form.uuid']);
  state.formUuids = formMetadata
    .filter(
      form => isValidUUID(form['OMRS form.uuid']) && form['Workflow'] === 'WF2'
    )
    .map(form => form['OMRS form.uuid']);

  state.formMaps = state.data.find(i => i.key === 'formMaps')?.value;
  delete state.data;
  delete state.references;
  return state;
});

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

  const uuids = [
    ...new Set(
      state.allResponse?.entry?.map(p =>
        p.resource?.subject?.reference?.replace('Patient/', '')
      )
    ),
  ];
  state.encounterPatientUuids = [...new Set(uuids)];

  return state;
});

fn(state => {
  const { cursor, lastRunDateTime, searchPatientUuids, encounterPatientUuids } =
    state;

  const onlyInSearchPatient = searchPatientUuids.filter(
    id => !encounterPatientUuids.includes(id)
  );

  const onlyInR4Encounter = encounterPatientUuids.filter(
    id => !searchPatientUuids.includes(id)
  );
  const inbothResults = searchPatientUuids.filter(id =>
    encounterPatientUuids.includes(id)
  );
  const patientUuids = [...new Set(searchPatientUuids, encounterPatientUuids)];

  console.log('inbothResults', inbothResults.length);
  console.log('patient-search-array', onlyInSearchPatient.length);
  console.log('r4-encounter-array', onlyInR4Encounter.length);
  console.log('combined uuids', patientUuids.length);

  return { ...state, cursor, lastRunDateTime, patientUuids };
});

//Prepare require global mapping

// Fetch patient encounters
each(
  $.patientUuids,
  get('encounter', { patient: $.data, v: 'full' }).then(state => {
    state.allEncounters ??= [];
    state.allEncounters.push(
      ...state.data.results.filter(e => state.formUuids.includes(e?.form?.uuid))
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

    const encounters = filteredEncounters
      .map(pe => {
        const isLatestForm = pe.find(e => {
          return state.formMaps[e?.form?.uuid]?.syncType === 'latest';
        });
        if (isLatestForm) {
          return [isLatestForm];
        } else {
          const allPatientEncounter = pe.filter(
            e => state.formMaps[e?.form?.uuid]?.syncType === 'all'
          );
          return allPatientEncounter;
        }
      })
      .flat();

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
    next.encounters = next.encounters.map(
      ({ uuid, patient, obs, form, encounterDatetime }) => ({
        uuid,
        patient,
        obs,
        form,
        encounterDatetime,
      })
    );
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
