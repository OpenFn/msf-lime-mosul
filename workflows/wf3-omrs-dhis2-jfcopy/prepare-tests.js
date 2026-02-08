fn(state => {
  return {
    ...state.data.body[0].test_input,
    testMode: true
  };
});