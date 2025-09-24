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

  state.patientUuids = [
    ...new Set(
      state.allResponse?.entry?.map((p) =>
        p.resource.subject.reference.replace("Patient/", "")
      )
    ),
  ];

  return state;
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// Fetch patient encounters
each(
  $.patientUuids,
  get("encounter", { patient: $.data, v: "full" }).then((state) => {
    const patientUuid = state.references.at(-1);
    const filteredEncounters = state.formUuids.map((formUuid) =>
      state?.data?.results
        .filter(
          (e) =>
            e.auditInfo.dateCreated >= state.cursor &&
            e?.form?.uuid === formUuid
        )
        .sort(
          (a, b) =>
            new Date(b.auditInfo.dateCreated) -
            new Date(a.auditInfo.dateCreated)
        )
    );

    // Why we only keep the latest one form encounter?
    const encounters = filteredEncounters.map((e) => e[0]).filter((e) => e);
    state.encounters ??= [];
    state.encounters.push(...encounters);

    console.log(
      encounters.length,
      `# of filtered encounters found in OMRS for ${patientUuid}`
    );
    delay(1500);

    return state;
  })
);

fn((state) => {
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
    );
    console.log(next.encounters.length, "# of new encounters to sync to dhis2");
  } else {
    console.log("No encounters found for cursor: ", next.cursor);
  }

  // Group encounters by patient UUID
  next.encountersByPatient = next.encounters?.reduce((acc, obj) => {
    const key = obj.patient.uuid;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(obj);
    return acc;
  }, {});

  return next;
});
