fn((state) => {
  state.relationshipsMapping = Object.values(state.childTeis)
    .map((tei) => {
      const omrsPatientUuid = tei?.attributes.find(
        ({ attribute }) => attribute === "AYbfTPYMNJH"
      )?.value;

      const childTei = tei?.trackedEntity;
      const parentTei = state.parentTeis[omrsPatientUuid]?.trackedEntity;
      const relationshipType = tei?.relationshipType || "cJJTZ51EK24"; // Default: Mental Health relationship

      if (childTei != parentTei && parentTei) {
        return {
          from: {
            trackedEntityInstance: {
              trackedEntityInstance: parentTei,
            },
          },
          to: {
            trackedEntityInstance: {
              trackedEntityInstance: childTei,
            },
          },
          relationshipType,
        };
      }
    })
    .filter(Boolean);

  return state;
});
// Check if relationship exist
each(
  $.relationshipsMapping,
  get("tracker/relationships", {
    trackedEntity: $.data.from.trackedEntityInstance.trackedEntityInstance,
  }).then((state) => {
    const relationship = state.references.at(-1);
    const toTei = relationship.to.trackedEntityInstance.trackedEntityInstance;
    const hasRelationship = state.data.instances.find(
      (r) => r.to.trackedEntity.trackedEntity === toTei
    );
    state.relationshipsToCreate ??= [];
    if (!hasRelationship) {
      state.relationshipsToCreate.push(relationship);
    }
    console.log({ toCreate: state.relationshipsToCreate });
    return state;
  })
);

// Creating relationship between parent and child tei
each($.relationshipsToCreate || [], create("relationships", $.data));
