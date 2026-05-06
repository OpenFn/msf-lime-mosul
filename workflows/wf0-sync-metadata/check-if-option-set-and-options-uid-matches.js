fn(state => {
  // Initialize array to track OptionSet UID mismatches
  state.OptionSetUIDNotMatched = state.OptionSetUIDNotMatched || [];

  // Get the fetched program stage data from previous job
  const fetchedDataEntryData = state.fetchedDataEntryData || [];


  // Process each program stage's data elements
  fetchedDataEntryData.forEach((programStageData, index) => {

    if (programStageData.programStageDataElements) {
      programStageData.programStageDataElements.forEach(element => {
        const dataElementId = element.dataElement.id;
        const dhis2OptionSetUid = element.dataElement.optionSet?.id;

        // Only validate if the data element has an option set in DHIS2
        if (dhis2OptionSetUid) {
          // Find corresponding entry in optsMap using DHIS2 DE UID
          const optsMapEntry = state.optsMap?.find(opts => opts["DHIS2 DE UID"] === dataElementId);

          if (optsMapEntry) {
            const xlsOptionSetUid = optsMapEntry["DHIS2 Option Set UID"];

            // Compare OptionSet UIDs
            if (xlsOptionSetUid && xlsOptionSetUid !== dhis2OptionSetUid) {
              const errorMessage = `Option Set UID mismatch for Data Element ${dataElementId}: XLS UID '${xlsOptionSetUid}' does not match DHIS2 UID '${dhis2OptionSetUid}'.`;

              state.OptionSetUIDNotMatched.push(errorMessage);
            }
          }
          //  else {
          //   console.log(`No optsMap entry found for Data Element ${dataElementId}`);
          // }
        }
      });
    }
  });


  // Group optsMap by DHIS2 Option Set UID
  const groupedByOptionSet = (state.optsMap || []).reduce((groups, entry) => {
    const optionSetUid = entry["DHIS2 Option Set UID"];

    if (optionSetUid) {
      if (!groups[optionSetUid]) {
        groups[optionSetUid] = [];
      }
      groups[optionSetUid].push(entry);
    }
    return groups;
  }, {});

  state.groupedByOptionSet = groupedByOptionSet;

  // Get unique DHIS2 Option Set UIDs for API calls
  const uniqueOptionSetUids = Object.keys(groupedByOptionSet);
  state.uniqueOptionSetUids = uniqueOptionSetUids;

  console.log(`OptionSet UID validation complete: ${state.OptionSetUIDNotMatched.length} mismatches found`);
  return state;
});


// Fetch OptionSets data for each unique DHIS2 Option Set UID
each(
  '$.uniqueOptionSetUids[*]',
  get(
    state => `optionSets/${state.data}?fields=id,name,options[id,name,code]`)
    .catch((error, state) => {
      // ...
      return state;
    })
    .then((state) => {

      // Initialize optionSetsData 
      if (!state.optionSetsData) {
        state.optionSetsData = {};
      }

      // Store fetched optionSet data
      const optionSetUid = state.data.id;
      state.optionSetsData[optionSetUid] = state.data;


      return state;
    })

);

fn(state => {

  state.OptionUIDNotMatched = state.OptionUIDNotMatched || [];
  state.OptionNameNotMatched = state.OptionNameNotMatched || [];
  state.OptionCodeNotMatched = state.OptionCodeNotMatched || [];

  const groupedByOptionSet = state.groupedByOptionSet || {};
  const optionSetsData = state.optionSetsData || {};

  // For each Option Set UID from the XLS mapping
  Object.entries(groupedByOptionSet).forEach(([optionSetUid, rows]) => {
    const optionSet = optionSetsData[optionSetUid];

    if (!optionSet) {
      // console.log(`No DHIS2 OptionSet data found for UID ${optionSetUid}`);
      return;
    }

    // Build a map: option UID -> { name, code } from DHIS2
    const dhis2OptionsById = new Map(
      (optionSet.options || [])
        .filter(opt => opt != null)
        .map(opt => [
          opt.id,
          { name: opt.name, code: opt.code }
        ])
    );

    // Compare each XLS row in OptionSet
    rows.forEach(entry => {
      const optionUid = entry['DHIS2 Option UID'];
      const xlsName = entry['DHIS2 Option Name'];
      const xlsCode = entry['DHIS2 Option Code'];


      if (!optionUid) return;

      const dhis2Option = dhis2OptionsById.get(optionUid);

      // 1. Option UID must exist in DHIS2 OptionSet
      if (!dhis2Option) {
        const msg = `Option UID ${optionUid} not found in DHIS2 Option Set ${optionSetUid}.`;
        state.OptionUIDNotMatched.push(msg);
        return;
      }

      // 2. Compare names
      const dhis2Name = dhis2Option.name || '';
      const xlsNameNorm = (xlsName || '').trim().toLowerCase();
      const dhis2NameNorm = (dhis2Name || '').trim().toLowerCase();

      if (xlsNameNorm && dhis2NameNorm && xlsNameNorm !== dhis2NameNorm) {
        const msg = `Option name mismatch for Option UID ${optionUid}: XLS name '${xlsName}' does not match DHIS2 name '${dhis2Name}'.`;
        state.OptionNameNotMatched.push(msg);
      }

      // 2. Compare codes
      const dhis2Code = dhis2Option.code || '';
      const xlsCodeNorm = (xlsCode || '').trim().toLowerCase();
      const dhis2CodeNorm = (dhis2Code || '').trim().toLowerCase();

      if (xlsCodeNorm && dhis2CodeNorm && xlsCodeNorm !== dhis2CodeNorm) {
        const msg = `Option code mismatch for Option UID ${optionUid}: XLS code '${xlsCode}' does not match DHIS2 code '${dhis2Code}'.`;
        state.OptionCodeNotMatched.push(msg);
      }

    });
  });

  return state;
});
