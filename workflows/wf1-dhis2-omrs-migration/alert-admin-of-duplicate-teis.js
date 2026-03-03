fn(state => {
  const code = 'DUPLICATE_PATIENT_NUMBERS';
  const description = `Found ${state.duplicatePatients.length} TIEs with duplicate patient numbers`;
  const message = `${code}: ${description}`;
  const patientNumbers = state.duplicatePatients.map(
    patient =>
      patient.attributes.find(attr => attr.code === 'patient_number').value
  );

  const details = {
    code,
    description,
    duplicatePatientNumbers: patientNumbers,
  };
  const e = new Error(message);
  e.details = details;
  console.error(e.details);
  throw e;
});
