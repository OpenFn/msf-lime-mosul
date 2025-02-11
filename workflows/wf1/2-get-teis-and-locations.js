// Get teis that are "active" in the target program
get(
  'tracker/trackedEntities',
  {
    orgUnit: $.orgUnit, //'OPjuJMZFLop',
    program: $.program, //'w9MSPn5oSqp',
    programStatus: 'ACTIVE',
    updatedAfter: $.cursor,
    skipPaging: true,
  },
  {},
  state => {
    // console.log('TEIs found ::', JSON.stringify(state.data.instances, null,2))
    const teis = state.data.instances.filter(
      tei => tei.updatedAt >= state.cursor
    );

    console.log(
      '# of TEIs found before filter ::',
      state.data.instances.length
    );
    console.log('# of TEIs to migrate to OMRS ::', teis.length);

    return {
      ...state,
      data: {},
      references: [],
      teis,
    };
  }
);

get('optionGroups/kdef7pUey9f', {
  fields: 'id,displayName,options[id,displayName,code]',
});

fn(({ data, ...state }) => {
  state.locations = data;
  return state;
});
