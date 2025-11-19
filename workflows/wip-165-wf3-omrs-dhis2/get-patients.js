function removeLinks(data) {
  if (Array.isArray(data)) {
    return data.map(removeLinks);
  }

  if (typeof data === "object" && data !== null) {
    const { links, ...rest } = data;
    return Object.fromEntries(
      Object.entries(rest).map(([key, value]) => [key, removeLinks(value)])
    );
  }

  return data;
}

function removeNulls(data) {
  if (Array.isArray(data)) {
    return data.filter((item) => item !== null).map(removeNulls);
  }

  if (typeof data === "object" && data !== null) {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== null) {
        result[key] = removeNulls(value);
      }
    }
    return result;
  }

  return data;
}
cursor($.lastRunDateTime || $.manualCursor || "2025-03-20T06:01:24.000Z");

cursor("today", {
  key: "lastRunDateTime",
  format: (c) => dateFns.format(new Date(c), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
});

searchPatient({
  q: $.msfId || "IQ",
  v: "full",
  limit: "100",
});

fn((state) => {
  const { cursor, data, lastRunDateTime } = state;
  console.log("Filtering patients since cursor:", cursor);

  state.patients = data.results
    .filter(({ auditInfo }) => {
      const lastModified = auditInfo?.dateChanged || auditInfo?.dateCreated;
      return lastModified > cursor;
    })
    .map((p) => {
      const { uuid, auditInfo, identifiers, person } = removeLinks(
        removeNulls(p)
      );
      const { dateCreated } = auditInfo;
      const { age, birthdate, gender, names, addresses, attributes } = person;

      return {
        uuid,
        person: {
          age,
          birthdate,
          gender,
          names,
          addresses: [addresses.find((a) => a.cityVillage)],
          attributes,
        },
        identifiers,
        auditInfo: { dateCreated },
      };
    });
  state.searchPatientUuids = state.patients.map((p) => p.uuid);
  console.log("# of patients to sync to dhis2 ::", state.patients.length);

  return state;
});

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

  console.log("inbothResults", inbothResults.length);
  console.log("patient-search-array", onlyInSearchPatient.length);
  console.log("r4-encounter-array", onlyInR4Encounter.length);
  console.log("combined uuids", patientUuids.length);

  return { cursor, lastRunDateTime, patients, patientUuids };
});
