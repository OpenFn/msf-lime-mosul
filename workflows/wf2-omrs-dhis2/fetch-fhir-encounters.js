
// Fetch all encounters
http
  .get("/ws/fhir2/R4/Encounter", {
    query: { _count: 100, _lastUpdated: `ge${$.cursor}` },
  })
  .then((state) => {
    const { link, total } = state.data;
    state.nextUrl = link
      .find((l) => l.relation === "next")
      ?.url.replace(/(_count=)\d+/, `$1${total}`)
      .split("/openmrs")[1];

    state.allResponse = state.data;
    return state;
  });

fnIf(
  $.nextUrl,
  http.get($.nextUrl).then((state) => {
    console.log(`Fetched ${state.data.entry.length} remaining encounters`);
    delete state.allResponse.link;
    state.allResponse.entry.push(...state.data.entry);
    return state;
  })
);

fn((state) => {
  console.log(
    "Total # of encounters fetched: ",
    state.allResponse?.entry?.length
  );

  const uuids = [
    ...new Set(
      state.allResponse?.entry?.map((p) =>
        p.resource?.subject?.reference?.replace("Patient/", "")
      )
    ),
  ];
  state.encounterPatientUuids = [...new Set(uuids)];

  return state;
});

fn((state) => {
  const {
    cursor,
    lastRunDateTime,
    patients,
    searchPatientUuids,
    encounterPatientUuids,
  } = state;

  const onlyInSearchPatient = searchPatientUuids.filter(
    (id) => !encounterPatientUuids.includes(id)
  );

  const onlyInR4Encounter = encounterPatientUuids.filter(
    (id) => !searchPatientUuids.includes(id)
  );
  const inbothResults = searchPatientUuids.filter((id) =>
    encounterPatientUuids.includes(id)
  );
  const patientUuids = [
    ...new Set([...searchPatientUuids, ...encounterPatientUuids]),
  ];

  console.log({ inbothResults });
  console.log("In both searchPatient() && R4/Encounter", inbothResults.length);
  console.log("searchPatient() only", onlyInSearchPatient.length);
  console.log("R4/Encounter only", onlyInR4Encounter.length);
  console.log("searchPatient() + R4/Encounter Uuids", patientUuids.length);

  return { cursor, lastRunDateTime, patients, patientUuids };
});