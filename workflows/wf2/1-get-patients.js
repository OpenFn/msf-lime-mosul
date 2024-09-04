// here we define the date cursor
fn(state => {
  //manualCursor at beggining of the project 2023-05-20T06:01:24.000+0000
  const manualCursor = '2023-07-27T07:16:24.544Z';

  state.cursor = state.lastRunDateTime || manualCursor;

  console.log(
    'Date cursor to filter & get only recent OMRS records ::',
    state.cursor
  );

  return state;
});

searchPatient({ q: 'Patient', v: 'full', limit: '100' });
//Query all patients (q=all) not supported on demo OpenMRS; needs to be configured
//...so we query all Patients with name "Patient" instead

fn(state => {
  const { body } = state.data;

  const getPatientByUuid = uuid => {
    return body.results.find(patient => patient.uuid === uuid);
  };
  // console.log('dateCreated for patient uuid ...2c6dbfc5acc8',getPatientByUuid("31b4d9c8-f7cc-4c26-ae61-2c6dbfc5acc8").auditInfo.dateCreated)

  //console.log(JSON.stringify(state.data, null, 2));

  console.log('Filtering patients to only sync most recent records...');

  state.patients = body.results.filter(
    patient =>
      (patient.auditInfo.dateChanged === null
        ? patient.auditInfo.dateCreated
        : patient.auditInfo.dateChanged) > state.cursor
  );
  console.log('# of new patients to sync to dhis2 ::', patients.length);
  // console.log(JSON.stringify(patients, null, 2));

  state.lastRunDateTime = new Date().toISOString();
  console.log('Updating cursor; next sync start date:', lastRunDateTime);

  state.data = {};
  state.references = [];
  return state;
});
