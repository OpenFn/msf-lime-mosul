// http.get('/ws/rest/v1/localeandthemeconfiguration').then(state => {
//   const { data } = state;
//   return { data };
// });
// http
//   .get(
//     '/ws/rest/v1/encounter?patient=0e3e3d1f-7819-406b-8b39-c45c89dd35dc&v=full'
//   )
//   .then(({ data }) => ({ data }));
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
  // state.encounterUuids = state.allResponse?.entry?.map(p => p.resource.id);
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
  get(`encounter?patient=${$.data}&v=full`).then(state => {
    state.allEncounters ??= [];
    state.allEncounters.push(
      ...state.data.results.filter(e =>
        state.v2FormUuids.includes(e?.form?.uuid)
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

    // const encounters = filteredEncounters.map(e => e[0]).filter(e => e);
    // const encounters = filteredEncounters.map(e => {
    //   const isLatestForm = state.formMaps[e?.form?.uuid]?.syncType === 'latest'
    //   if (isLatestForm) {
    //     return e[0]
    //   } else { return e }
    // }).filter(Boolean)

    state.encounters ??= [];
    state.encounters.push(...encounters);
    // state.encounters = state.encounters.filter(obj => Object.keys(obj).length);
    // console.log({ encounters: state.encounters })
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
