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
    const encounters = filteredEncounters.map((e) => e[0]).filter(Boolean);
    state.encounters ??= [];
    state.encounters.push(...encounters);

    console.log(
      state.encounters?.length,
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
    encounters,
    ...next
  } = state;

  if (encounters?.length) {
    next.encountersByVisit = encounters
      .map((encounter) => {
        const { uuid, patient, obs, form, encounterDatetime, visit } =
          removeLinks(removeNulls(encounter));

        return {
          visit: { uuid: visit?.uuid },
          uuid,
          patient: {
            uuid: patient.uuid,
            display: patient.display,
          },
          obs: obs.map((o) => {
            return {
              uuid: o.uuid,
              concept: o.concept,
              display: o.display,
              formFieldPath: o.formFieldPath,
              value: o.value,
            };
          }),
          form: {
            uuid: form.uuid,
            display: form.display,
            description: form.description,
            name: form.name,
          },
          encounterDatetime,
        };
      })
      .reduce((acc, curr) => {
        const visitUuid = curr.visit?.uuid;
        if (!acc[visitUuid]) {
          acc[visitUuid] = [curr];
        } else {
          acc[visitUuid].push(curr);
        }

        return acc;
      }, {});
  } else {
    console.log("No encounters found for cursor: ", next.cursor);
  }

  return next;
});
