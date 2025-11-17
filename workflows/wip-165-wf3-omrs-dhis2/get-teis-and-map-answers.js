const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const teiByPatientUuid = (patientUuid, teis) => {
  return teis.find((tei) => {
    const omrsPatientUuid = tei.attributes.find(
      ({ attribute }) => attribute === "AYbfTPYMNJH"
    )?.value;

    return omrsPatientUuid === patientUuid;
  });
};

get("tracker/trackedEntities", {
  orgUnit: $.orgUnit,
  program: $.program,
  filter: (state) => [
    `AYbfTPYMNJH:IN:${state.encountersPatientUuids.join(";")}`,
  ],
  fields: "*",
});

fn((state) => {
  state.TEIs ??= {};
  state.encountersPatientUuids.forEach((patientUuid) => {
    const tei = teiByPatientUuid(patientUuid, state.data.instances);
    if (tei?.trackedEntity) {
      console.log("Parent TEI found:", tei.trackedEntity);

      state.TEIs[patientUuid] = {
        trackedEntity: tei.trackedEntity,
        attributes: tei.attributes,
        trackedEntityType: tei.trackedEntityType,
        enrollment: tei.enrollments[0]?.enrollment,
        events: tei.enrollments[0]?.events,
      };
    } else {
      console.log("Parent TEI Not Found for Patient:", patientUuid);
    }
  });

  return state;
});
