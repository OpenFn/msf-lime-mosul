fn(state => {

  const DEIdNotFound = state.DEIdNotFound || [];
  const OptionUIDNotMatched = state.OptionUIDNotMatched || [];
  const OptionCodeNotMatched = state.OptionCodeNotMatched || [];


  const errorSummary = {
    DEIdNotMatched: DEIdNotFound,
    OptionUIDNotMatched,
    OptionCodeNotMatched,
  };


  const hasErrors =
    DEIdNotFound.length > 0 ||
    OptionUIDNotMatched.length > 0 ||
    OptionCodeNotMatched.length > 0;


  state.validationErrorSummary = errorSummary;

  if (hasErrors) {
    // Throw if errors exist
    const message =
      '****** Validation errors found in DHIS2 metadata checks:\n' +
      JSON.stringify(errorSummary, null, 2);

    throw new Error(message);
  }

  return state;
});
