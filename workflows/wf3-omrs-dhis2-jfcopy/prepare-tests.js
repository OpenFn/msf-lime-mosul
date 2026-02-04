// fn(state => {
//   const { test_input } = state.data.body[0];
//   return { data: { test_input } };
// });

fn(state => {
  const { latestEncountersByVisit } = state.data.body[0].test_input;
  return { latestEncountersByVisit };
});