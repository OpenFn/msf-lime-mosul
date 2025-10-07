fn((state) => {
  state.patientUuids = state.teisWithOMRSID.map((patient) => {
    return patient.attributes.find(
      (attr) => attr.displayName === "OpenMRS patient UID"
    )?.value;
  });
  state.notFound ??= [];
  return state;
});

each(
  $.patientUuids,
  get(`patient/${$.data}`).catch((error, state) => {
    if (error) {
      const tei = state.teisWithOMRSID.find(
        (tei) =>
          tei.attributes.find(
            (attr) => attr.displayName === "OpenMRS patient UID"
          )?.value === state.data
      );
      state.notFound.push({ patient: state.data, tei: tei.trackedEntity });
    }
    return state;
  })
);

fnIf($.notFound.length > 0, (state) => {
  const details = state.notFound
    .map(
      ({ patient, tei }) =>
        `Patient not found in OMRS for TEI:${tei} with OMRS ID: ${patient}.`
    )
    .join("\n");
  const e = new Error(details);
  throw e;
});
