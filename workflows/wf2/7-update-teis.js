fn(state => {
  const { optsMap, genderUpdated, TEIs } = state;
  const genderMap = optsMap
    .filter(o => o['DHIS2 DE UID'] === 'qptKDiv9uPl')
    .reduce((acc, obj) => {
      acc[obj['value.display - Answers']] = obj['DHIS2 Option Code'];
      return acc;
    }, {});

  state.teisToUpdate = genderUpdated
    .map(answer => {
      const { trackedEntity } = TEIs[answer.person.uuid] || {};
      if (!trackedEntity) {
        console.log('No TEI found for person', answer.person.uuid);
      }
      if (trackedEntity) {
        return {
          trackedEntity,
          program: state.program,
          orgUnit: state.orgUnit,
          trackedEntityType: 'cHlzCA2MuEF',
          attributes: [
            {
              attribute: 'qptKDiv9uPl', //gender
              value: genderMap[answer.value.display],
            },
            {
              attribute: 'AYbfTPYMNJH', //OpenMRS Patient UID to use to upsert TEI
              value: answer.person.uuid,
            },
          ],
        };
      }
    })
    .filter(Boolean);
  return state;
});

// Update TEIs
create(
  'tracker',
  { trackedEntities: $.teisToUpdate },
  { params: { async: false, importStrategy: 'UPDATE' } }
);

fn(({ lastRunDateTime }) => ({ lastRunDateTime }));
