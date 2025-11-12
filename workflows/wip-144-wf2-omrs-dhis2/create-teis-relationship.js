fn((state) => {
  state.relationshipsMapping = Object.keys(state.childTeis)
    .map((uuid) => {
      const childTei = state.childTeis[uuid].trackedEntity;
      const parentTei = state.parentTeis[uuid].trackedEntity;

      if (childTei != parentTei) {
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
          relationshipType: "cJJTZ51EK24", //TODO: Need to change this hardcoded id, because it will be different for d/t programs
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
    return state;
  })
);

// Creating relationship between parent and child tei
each($.relationshipsToCreate || [], create("relationships", $.data));
