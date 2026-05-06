
const baseUrl = "https://sheets.googleapis.com/v4/spreadsheets";
const gsheetId = "1Hnd2vMC7cK5OMksk5-4lv_OpqkXA1zSo1DrbtnopLtg";
const genSheets = (sourceFile) => {
  const todayDate = new Date().toISOString().split("T")[0];

  const shortFile = sourceFile
    .split("LIME EMR - Iraq Metadata - Release 1 -")[1]
    .replace(/\s+/g, "")
    .toLowerCase();
  const sheetAffix = `${shortFile}:runDate:${todayDate}`;
  return [`WarningErrors:${sheetAffix}`, `FailingErrors:${sheetAffix}`];
};
fn((state) => {
  state.sheets = genSheets(state.sourceFile);
  return state;
});

get(`${baseUrl}/${gsheetId}`, {
  headers: { Authorization: `Bearer ${$.configuration.access_token}` },
});

fn((state) => {
  const existingSheets = state.data.sheets.map((s) => s.properties.title);
  state.newSheets ??= [];
  state.sheets.forEach((sheet) => {
    if (!existingSheets.includes(sheet)) {
      state.newSheets.push(sheet);
    }
  });
  return state;
});

each(
  $.newSheets,
  post(
    `${baseUrl}/${gsheetId}:batchUpdate`,
    {
      requests: [
        {
          addSheet: {
            properties: {
              title: $.data,
            },
          },
        },
      ],
    },
    {
      headers: {
        Authorization: (state) => `Bearer ${state.configuration.access_token}`,
      },
    }
  )
);

fn((state) => {
  state.sheetsMapping = state.sheets.map((s) => {
    if (s.includes("WarningErrors:")) {
      const warningValues = [["Error Type", "Error Message"]];
      Object.entries(state.warningSummary).forEach(([header, values]) => {
        const rows = values.map((v) => [header, v]);
        warningValues.push(...rows);
      });
      return {
        range: `${s}!A:B`,
        values: warningValues,
      };
    }
    if (s.includes("FailingErrors:")) {
      const DEIdNotFound = state.DEIdNotFound || [];
      const OptionUIDNotMatched = state.OptionUIDNotMatched || [];
      const OptionCodeNotMatched = state.OptionCodeNotMatched || [];
      const OptionSetUIDNotMatched = state.OptionSetUIDNotMatched || [];

      const errorSummary = {
        DEIdNotMatched: DEIdNotFound,
        OptionUIDNotMatched,
        OptionCodeNotMatched,
        OptionSetUIDNotMatched,
        // optionSetNotDefinedInOptionSetsSheet,
      };
      const errorsValues = [["Error Type", "Error Message"]];
      Object.entries(errorSummary).forEach(([header, values]) => {
        const rows = values.map((v) => [header, v]);
        errorsValues.push(...rows);
      });
      return {
        range: `${s}!A:B`,
        values: errorsValues,
      };
    }
  });

  return state;
});
