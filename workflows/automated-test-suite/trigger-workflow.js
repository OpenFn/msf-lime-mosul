post(
  'https://app.openfn.org/i/14199314-c27f-48b3-8aa5-6c3800a64635',
  {
    body: state.prepareInputs.map(item => ({
      test_scenario: item.test_scenario,
      test_input: JSON.parse(item.input)
    }))
  }
);