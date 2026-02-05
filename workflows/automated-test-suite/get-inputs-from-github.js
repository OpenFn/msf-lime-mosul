fn(state => {
  state.prepareInputs = []
  return state
})
each(
  $.testCases,
  get($.data.input_payload).then(state => {
    const testScenario = state.references.at(-1)
    state.prepareInputs.push({ ...testScenario, input: state.data })
    return state
  })
);