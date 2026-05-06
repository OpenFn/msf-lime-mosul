fn(state => {

  const programStageIds = Object.values(state.formMaps);
  state.fetchedDataEntryData = [];
  state.extractedDataValueMaps = {};
  state.DEIdNotFound=[];
    state.DENameNotMatched = [];

  Object.entries(state.formMaps).forEach(([formUuid, values]) => {
    if (state.formMaps[formUuid] && state.formMaps[formUuid].dataValueMap) {
      state.extractedDataValueMaps[values.programStage] = {
        formUuid,
        dataValueMap: state.formMaps[formUuid].dataValueMap
      };
    }
  });

  return { programStageIds, ...state };
})

each('$.programStageIds[*]', get(state => `programStages/${state.data.programStage}.json?fields=programStageDataElements[dataElement[id,name,optionSet[id, name]]]`).then(state => {

  state.fetchedDataEntryData.push(state.data)
  return state
}))


fn(state => {
  state.comparison = [];
  state.missingDataElements = [];
  
  state.fetchedDataEntryData.forEach((programStageData, index) => {
    const programStageId = state.programStageIds[index];
    const extractedData = state.extractedDataValueMaps[programStageId.programStage];
    
    if (extractedData) {
      // Create a Set of valid DHIS2 data element IDs for fast lookup
      const validDhis2DataElementIds = new Set(
        programStageData.programStageDataElements?.map(element => element.dataElement.id) || []
      );

        const dhis2DataElementNames = new Map(
        programStageData.programStageDataElements?.map(element => [
          element.dataElement.id, 
          element.dataElement.name
        ]) || []
      );
      
      const comparison = {
        programStageId: programStageId.programStage,
        formUuid: extractedData.formUuid,
        totalFormDataElements: Object.keys(extractedData.dataValueMap).length,
        validFormDataElements: 0,
        invalidFormDataElements: 0,
        nameMatchedElements: 0,
        nameMismatchedElements: 0,
        results: []
      };
      
      // Check each data element from state against DHIS2 API response
      Object.entries(extractedData.dataValueMap).forEach(([dataElementId, value]) => {
        const existsInDhis2 = validDhis2DataElementIds.has(dataElementId);
         let nameMatches = null;
        let xlsName = null;
        let dhis2Name = null;
        
        if (existsInDhis2) {
          comparison.validFormDataElements++;

                    // Check name match for existing data elements
          dhis2Name = dhis2DataElementNames.get(dataElementId);
          // Find corresponding name from optsMap using "DHIS2 DE UID"
          const optsMapEntry = state.optsMap?.find(opts => opts["DHIS2 DE UID"] === dataElementId);
          if (optsMapEntry) {
            xlsName = optsMapEntry["DHIS2 DE Name"];
            
            // Compare names (case-insensitive trim comparison)
            nameMatches = xlsName && xlsName.trim().toLowerCase() === dhis2Name.trim().toLowerCase();
            
            if (nameMatches) {
              comparison.nameMatchedElements++;
            } else {
              comparison.nameMismatchedElements++;
              
              const nameErrorMessage = `Data Element ${dataElementId} name mismatch: XLS name '${xlsName}' does not match DHIS2 name '${dhis2Name}'.`;
              state.DENameNotMatched.push(nameErrorMessage);
            }
          }
        } else {
          comparison.invalidFormDataElements++;
          
          // Collect data elements from state that don't exist in DHIS2
          state.missingDataElements.push({
            programStageId: programStageId.programStage,
            formUuid: extractedData.formUuid,
            dataElementId,
            value,
            message: `Data Element ${dataElementId} not found in DHIS2 program stage ${programStageId.programStage}`
          });

          state.DEIdNotFound.push(`Data Element ${dataElementId} not found in DHIS2 program stage ${programStageId.programStage}`)
        }
        
        comparison.results.push({
          dataElementId,
          value,
          existsInDhis2,
          xlsName,
          dhis2Name,
          nameMatches
        });
      });
      
      state.comparison.push(comparison);
    }
  });
  
  return state;
});
