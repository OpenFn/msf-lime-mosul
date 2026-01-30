// Only run if there are missing option sets to report
fnIf(
  (state) => state.missingOptsets && state.missingOptsets.length > 0,
  batchUpdateValues({
    spreadsheetId: '13yjqiejKFf6HlNCvgfgaKNi9Gffhq22RUTwXKUPR36k',
    range: 'Missing OptionSets Mappings!A1',
    values: (state) => {
      // Prepare header row
      const headers = [
        'Timestamp',
        'OpenMRS Question',
        'Concept External ID',
        'Answer Display',
        'Answer UUID',
        'DHIS2 DE UID',
        'DHIS2 OptionSet UID',
        'Metadata File',
        'Encounter UUID',
        'Patient UUID',
      ];

      // Transform state.missingOptsets into rows
      const rows = state.missingOptsets.map((opt) => [
        opt.timestamp,
        opt.openMrsQuestion,
        opt.conceptExternalId,
        opt.answerDisplay,
        opt.answerValueUuid,
        opt.dhis2DataElementUid,
        opt.dhis2OptionSetUid,
        opt.metadataFileName,
        opt.encounterUuid,
        opt.patientUuid,
      ]);

      // Return headers + data rows
      return [headers, ...rows];
    },
  })
);

// Log summary statistics and Google Sheet URL
fn((state) => {
  if (state.missingOptsets && state.missingOptsets.length > 0) {
    const totalErrors = state.missingOptsets.length;
    const uniqueOptionSets = new Set(
      state.missingOptsets.map((opt) => opt.dhis2OptionSetUid)
    ).size;
    const uniqueDataElements = new Set(
      state.missingOptsets.map((opt) => opt.dhis2DataElementUid)
    ).size;

    const googleSheetUrl =
      'https://docs.google.com/spreadsheets/d/13yjqiejKFf6HlNCvgfgaKNi9Gffhq22RUTwXKUPR36k/edit#gid=0';

    console.log('');
    console.log('⚠️  Missing DHIS2 Option Codes Detected');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Errors: ${totalErrors}`);
    console.log(`Affected Option Sets: ${uniqueOptionSets}`);
    console.log(`Affected Data Elements: ${uniqueDataElements}`);
    console.log(`View Details: ${googleSheetUrl}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  } else {
    console.log('✅ No missing DHIS2 Option Codes detected');
  }

  return state;
})
