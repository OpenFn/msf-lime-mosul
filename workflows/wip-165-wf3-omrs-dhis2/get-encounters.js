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

    const filteredEncounters = state?.data?.results
      .filter(
        (e) =>
          e.auditInfo.dateCreated >= state.cursor &&
          state.formUuids.includes(e?.form?.uuid)
      )
      .sort(
        (a, b) =>
          new Date(b.auditInfo.dateCreated) - new Date(a.auditInfo.dateCreated)
      );

    // Why we only keep the latest one form encounter?
    // const encounters = filteredEncounters.map((e) => e[0]).filter((e) => e);
    state.encounters ??= [];
    state.encounters.push(...filteredEncounters);

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
    const encountersByVisit = encounters
      .map((encounter) => {
        const { uuid, patient, obs, form, encounterDatetime, visit } =
          removeLinks(removeNulls(encounter));

        return {
          visit: { uuid: visit.uuid },
          uuid,
          patient: {
            uuid: patient.uuid,
            display: patient.display,
          },
          obs: obs?.map((o) => {
            return {
              uuid: o.uuid,
              concept: o.concept,
              display: o.display,
              formFieldPath: o.formFieldPath,
              value: o.value,
            };
          }),
          form: {
            uuid: form?.uuid,
            display: form?.display,
            description: form?.description,
            name: form?.name,
          },
          encounterDatetime,
        };
      })
      .reduce((acc, curr) => {
        const visitPerForm = `${curr.visit.uuid}-${curr.form.uuid}`;
        if (!acc[visitPerForm]) {
          acc[visitPerForm] = [curr];
        } else {
          acc[visitPerForm].push(curr);
        }

        return acc;
      }, {});

    next.latestEncountersByVisit = Object.values(encountersByVisit)
      .map((encounters) => encounters[0]) // Latest encounter per visit
      .flat();

    next.encountersPatientUuids = [
      ...new Set(
        next.latestEncountersByVisit.map((encounter) => encounter.patient.uuid)
      ),
    ];
  } else {
    console.log("No encounters found for cursor: ", next.cursor);
  }

  return next;
});
