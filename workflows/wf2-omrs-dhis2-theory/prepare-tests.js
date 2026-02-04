fn(state => {
  const { test_input } = state.data.body[0];
  return { data: { test_input } };
});