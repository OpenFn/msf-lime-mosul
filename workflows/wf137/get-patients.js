cursor($.lastRunDateTime || '2025-05-20T06:01:24.000Z');

cursor('today', {
  key: 'lastRunDateTime',
  format: c => dateFns.format(new Date(c), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
});

searchPatient({ q: 'IQ', v: 'full', limit: '100' });
fn(state => {
  const { cursor, data } = state;
  console.log('Filtering patients since cursor:', cursor);
  console.log('Patient fetched', data.results.length);

  const patients = data.results.filter(({ auditInfo }) => {
    const lastModified = auditInfo?.dateChanged || auditInfo?.dateCreated;
    return lastModified > cursor;
  });
  state.searchPatientUuids = patients.map(p => p.uuid);
  console.log('# of patients to sync to dhis2 ::', patients.length);

  delete state.data;
  delete state.references;
  return state;
});
