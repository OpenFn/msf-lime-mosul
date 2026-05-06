fn(state => {
 
  const DENameNotMatched = state.DENameNotMatched || [];
  const OptionUIDNotMatched = state.OptionUIDNotMatched || [];
  const OptionNameNotMatched = state.OptionNameNotMatched || [];

  // Combine all warning lists into one object
  const warningSummary = {
    DENameNotMatched,
    OptionUIDNotMatched,
    OptionNameNotMatched,
  };

  // Check whether we have any warnings
  const hasWarnings =
    DENameNotMatched.length > 0 ||
    OptionUIDNotMatched.length > 0 ||
    OptionNameNotMatched.length > 0;

  if (hasWarnings) {
    console.log('******DHIS2 metadata Warnings found:******');
    console.log(JSON.stringify(warningSummary, null, 2));
  } else {
    console.log('No DHIS2 metadata warnings detected.');
  }

  // Keep the warnings in state 
  state.warningSummary = warningSummary;

  return state;
});
