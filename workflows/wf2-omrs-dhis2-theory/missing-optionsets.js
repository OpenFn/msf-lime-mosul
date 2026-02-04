// Only run if there are missing option sets to report
fn((state) => {
  const CHUNK_SIZE = 10000; // Adjust based on your needs (max ~10,000 for Google Sheets)
  const missingOptsets = state.missingOptsets;

  // Prepare header row
  const headers = [
    "Timestamp",
    "OpenMRS Question",
    "Concept External ID",
    "Answer Display",
    "Answer UUID",
    "DHIS2 DE UID",
    "DHIS2 OptionSet UID",
    "Metadata Form",
    "Encounter UUID",
    "Patient UUID",
    "Source File",
  ];

  // Transform data into rows
  const rows = missingOptsets.map((opt) => [
    opt.timestamp,
    opt.openMrsQuestion,
    opt.conceptExternalId,
    opt.answerDisplay,
    opt.answerValueUuid,
    opt.dhis2DataElementUid,
    opt.dhis2OptionSetUid,
    opt.metadataFormName,
    opt.encounterUuid,
    opt.patientUuid,
    opt.sourceFile,
  ]);

  // Create chunks
  const chunks = [];
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    chunks.push(rows.slice(i, i + CHUNK_SIZE));
  }

  // Store in state for processing
  state.chunks = chunks;
  state.headers = headers;

  return state;
});

// Write headers first
batchUpdateValues({
  spreadsheetId: "13yjqiejKFf6HlNCvgfgaKNi9Gffhq22RUTwXKUPR36k",
  range: "Missing OptionSets Mappings!A1",
  values: (state) => [state.headers],
});
// Process each chunk
each(
  (state) => state.chunks,
  batchUpdateValues({
    spreadsheetId: "13yjqiejKFf6HlNCvgfgaKNi9Gffhq22RUTwXKUPR36k",
    range: (state) => {
      const currentChunkIndex = state.chunks.indexOf(state.data);
      const startRow = 2 + currentChunkIndex * state.chunks[0].length;
      return `Missing OptionSets Mappings!A${startRow}`;
    },
    values: (state) => state.data,
  }),
);

// Log summary statistics
fn((state) => {
  if (state.missingOptsets && state.missingOptsets.length > 0) {
    const totalErrors = state.missingOptsets.length;
    const uniqueOptionSets = new Set(
      state.missingOptsets.map((opt) => opt.dhis2OptionSetUid),
    ).size;
    const uniqueDataElements = new Set(
      state.missingOptsets.map((opt) => opt.dhis2DataElementUid),
    ).size;

    const googleSheetUrl =
      "https://docs.google.com/spreadsheets/d/13yjqiejKFf6HlNCvgfgaKNi9Gffhq22RUTwXKUPR36k/edit#gid=0";

    console.log("");
    console.log("⚠️  Missing DHIS2 Option Codes Detected");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Metadata File: ${state.sourceFile}`);
    console.log(`Total Errors: ${totalErrors}`);
    console.log(`Affected Option Sets: ${uniqueOptionSets}`);
    console.log(`Affected Data Elements: ${uniqueDataElements}`);
    console.log(`View Details: ${googleSheetUrl}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
  } else {
    console.log("✅ No missing DHIS2 Option Codes detected");
  }

  return { lastRunDateTime: state.lastRunDateTime };
});
