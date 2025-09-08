const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

fn(state => {
  // Group encounters by patient UUID
  state.encountersByPatient = state.encounters.reduce((acc, obj) => {
    const key = obj.patient.uuid;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(obj);
    return acc;
  }, {});

  return state;
})

each(state => Object.keys(state.encountersByPatient), get('tracker/trackedEntities', {
  orgUnit: $.orgUnit,
  program: $.program,
  filter: [`AYbfTPYMNJH:Eq:${$.data}`]
}).then(state => {
  const patientUid = state.references.at(-1)

  const tei = state.data?.instances?.[0];
  if (tei?.trackedEntity) {
    console.log('Parent TEI found:', tei.trackedEntity)
    state.parentTeis ??= {};
    state.parentTeis[patientUid] = tei;
  } else {
    console.log('Parent TEI Not Found for Patient:', patientUid)
    state.missingParentTeis ??= {}
    state.missingParentTeis[patientUid] = state.encountersByPatient[patientUid]
  }
  return state
}))

each(
  $.encounters,
  get('tracker/trackedEntities', state => ({
    orgUnit: state.formMaps[state.data.form.uuid].orgUnit,
    program: state.formMaps[state.data.form.uuid].programId,
    filter: [`AYbfTPYMNJH:Eq:${$.data.patient.uuid}`],
    fields: '*,enrollments[*],enrollments[events[*]], relationships[*]',
  })).then(async state => {
    const encounter = state.references.at(-1);
    console.log(encounter.patient.uuid, 'Encounter patient uuid');

    const { trackedEntity, enrollments } = state.data?.instances?.[0] || {};
    if (trackedEntity) {
      state.childTeis ??= {};
      state.childTeis[encounter.patient.uuid] = {
        trackedEntity,
        events: enrollments?.[0]?.events,
        enrollment: enrollments?.[0]?.enrollment,
      };
    } else {
      state.teisToCreate ??= {}
      const { attributes, trackedEntityType } = state.parentTeis[encounter.patient.uuid]
      const program = state.formMaps[encounter.form.uuid].programId
      const orgUnit = state.formMaps[encounter.form.uuid].orgUnit

      state.teisToCreate[encounter.patient.uuid] = {
        trackedEntityType,
        enrollments: [{
          orgUnit,
          program,
          enrollmentDate: new Date().toISOString().split('T')[0],
        }],
        attributes,
        orgUnit,
        program
      }
    }

    await delay(2000);
    return state;
  })
);

each(state => {
  return state?.teisToCreate ? Object.entries(state?.teisToCreate) : []
}, create('trackedEntityInstances', state => {
  const payload = state.data[1]
  return payload
}).then(state => {
  const [patient, payload] = state.references.at(-1)
  const trackedEntity = state.data?.response?.importSummaries[0]?.reference
  state.childTeis ??= {}
  state.createdTeis ??= []
  state.createdTeis.push(trackedEntity)
  state.childTeis[patient] = { trackedEntity }
  return state
}))

each($?.createdTeis || [], get(`tracker/trackedEntities/${$.data}`, { fields: 'attributes[*],enrollments,trackedEntity' }).then(state => {
  const { trackedEntity, enrollments, attributes } = state.data || {};
  console.log(state.data)
  const patientUuid = attributes.find(a => a.attribute === 'AYbfTPYMNJH').value

  console.log('Fetched Teis', state.data)
  state.childTeis ??= {};
  state.childTeis[patientUuid] = {
    trackedEntity,
    events: enrollments?.[0]?.events,
    enrollment: enrollments?.[0]?.enrollment,
  };

  return state
}))


fnIf($.childTeis && $.parentTeis, state => {
  const { childTeis, parentTeis } = state
  state.relationshipsMapping = Object.keys(childTeis).map(uuid => {
    const childTei = childTeis[uuid].trackedEntity
    const parentTei = parentTeis[uuid].trackedEntity

    if (childTei != parentTei) {
      return {
        "from": {
          "trackedEntityInstance": {
            "trackedEntityInstance": parentTei
          }
        },
        "to": {
          "trackedEntityInstance": {
            "trackedEntityInstance": childTei
          }
        },
        "relationshipType": "cJJTZ51EK24"
      }
    }

  }).filter(Boolean)
  return state
})
