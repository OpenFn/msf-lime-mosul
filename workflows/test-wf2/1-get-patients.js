cursor($.lastRunDateTime || $.manualCursor || '2023-05-20T06:01:24.000Z');

cursor('today', {
  key: 'lastRunDateTime',
  format: c => dateFns.format(new Date(c), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
});

get('/patient/0e3e3d1f-7819-406b-8b39-c45c89dd35dc', { v: 'full' }).then(
  state => {
    const { cursor, data, lastRunDateTime } = state;
    console.log('Filtering patients since cursor:', cursor);
    // console.log('Patient data:', data);

    state.patients = [data].filter(({ auditInfo }) => {
      const lastModified = auditInfo?.dateChanged || auditInfo?.dateCreated;
      return lastModified > cursor;
    });
    console.log('# of patients to sync to dhis2 ::', state.patients.length);
    console.log(
      'uuids of patients to sync to dhis2 ::',
      state.patients.map(p => p.uuid)
    );
    return state;
  }
);

// searchPatient({ q: 'IQ', v: 'full', limit: '100' });

// fn(state => {
//   const { cursor, data, lastRunDateTime } = state;
//   console.log('Filtering patients since cursor:', cursor);

//   const patients = data.results.filter(({ auditInfo }) => {
//     const lastModified = auditInfo?.dateChanged || auditInfo?.dateCreated;
//     return lastModified > cursor;
//   });
//   console.log('# of patients to sync to dhis2 ::', patients.length);
//   console.log(
//     'uuids of patients to sync to dhis2 ::',
//     patients.map(p => p.uuid)
//   );

//   return { cursor, lastRunDateTime, patients };
// });
