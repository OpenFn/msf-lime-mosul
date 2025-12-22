fn((state) => {
  state.relationshipsMapping = Object.values(state.createdChildTeis)
    .map((tei) => {
      const omrsPatientUuid = tei?.attributes.find(
        ({ attribute }) => attribute === "AYbfTPYMNJH"
      )?.value;
      const childTei = tei?.trackedEntity;
      const parentTei = state.parentTeis[omrsPatientUuid]?.trackedEntity;
      const relationshipType = tei?.relationshipType;

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
    .filter(Boolean); // :white_check_mark: This now filters out null entries
  console.log(
    `Total relationships to create: ${state.relationshipsMapping.length}`
  );
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
    console.log({ toCreate: state.relationshipsToCreate })
    return state;
  })
);

// Creating relationship between parent and child tei
each($.relationshipsToCreate || [], create("relationships", $.data));
