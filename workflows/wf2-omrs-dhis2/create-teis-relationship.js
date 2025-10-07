// Check if relationship exist
each($.relationshipsMapping, get('tracker/relationships', { trackedEntity: $.data.from.trackedEntityInstance.trackedEntityInstance }).then(state => {
  const relationship = state.references.at(-1)
  const toTei = relationship.to.trackedEntityInstance.trackedEntityInstance
  const hasRelationship = state.data.instances.find(r => r.to.trackedEntity.trackedEntity === toTei)
  state.relationshipsToCreate ??= []
  if (!hasRelationship) {
    state.relationshipsToCreate.push(relationship)
  }
  return state
}))

// Creating relationship between parent and child tei
each($.relationshipsToCreate, create('relationships', $.data))
