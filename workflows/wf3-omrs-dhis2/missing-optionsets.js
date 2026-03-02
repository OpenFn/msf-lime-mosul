// Only run if there are missing option sets to report
fn((state) => {
  const CHUNK_SIZE = 10000;
  const missingOptsets = state.missingOptsets;

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

  const allRows = missingOptsets.map((opt) => [
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

  state.allRows = allRows;
  state.headers = headers;

  return state;
});

// Get existing data to check for duplicates
getValues(
  "13yjqiejKFf6HlNCvgfgaKNi9Gffhq22RUTwXKUPR36k",
  "Missing OptionSets Mappings"
);

// Filter duplicates and prepare chunks
const CHUNK_SIZE = 10000;
fn((state) => {
  const allRows = state.allRows;

  // Get existing data (skip header row)
  const existingData = state.data?.values?.slice(1) || [];

  // Create a Set of unique keys from existing data
  // Key format: conceptExternalId|answerUuid|dhis2DeUid|encounterUuid
  const existingKeys = new Set(
    existingData.map(row => `${row[2]}|${row[4]}|${row[5]}|${row[8]}`)
  );

  // Filter out duplicates
  const newRows = allRows.filter(row => {
    const key = `${row[2]}|${row[4]}|${row[5]}|${row[8]}`;
    return !existingKeys.has(key);
  });

  console.log(`Total errors found: ${allRows.length}`);
  console.log(`New unique errors to add: ${newRows.length}`);
  console.log(`Duplicates filtered out: ${allRows.length - newRows.length}`);

  const chunks = [];
  for (let i = 0; i < newRows.length; i += CHUNK_SIZE) {
    chunks.push(newRows.slice(i, i + CHUNK_SIZE));
  }

  const nextRow = existingData.length + 2; // +2 for header and 1-indexing

  state.chunks = chunks;
  state.nextRow = nextRow;
  state.newRowCount = newRows.length;

  return state;
});

// Append data chunks (will add after existing rows)
each(
  (state) => state.chunks,
  batchUpdateValues({
    spreadsheetId: "13yjqiejKFf6HlNCvgfgaKNi9Gffhq22RUTwXKUPR36k",
    range: (state) => {
      const currentChunkIndex = state.index;
      const startRow = state.nextRow + (currentChunkIndex * CHUNK_SIZE);
      return `Missing OptionSets Mappings!A${startRow}`;
    },
    values: (state) => state.data,
  })
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