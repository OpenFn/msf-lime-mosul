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

cursor($.lastRunDateTime || "2025-03-20T06:01:24.000Z");

cursor("today", {
  key: "lastRunDateTime",
  format: (c) => dateFns.format(new Date(c), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"),
});

searchPatient({ q: $.msfId || "IQ", v: "full", limit: "100" });

fn((state) => {
  const { cursor, data } = state;
  console.log("Filtering patients since cursor:", cursor);
  console.log("Patient fetched", data.results.length);

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


  const searchPatientUuids = state.patients.map((p) => p.uuid);
  state[state.testMode ? 'patientUuids' : 'searchPatientUuids'] = searchPatientUuids;
  console.log("# of patients to sync to dhis2 ::", state.patients.length);

  return state;
});
