const isValidValue = value => value !== '' && value !== 'NA';

const mapArrayToObject = (item, keys) => {
  return item.reduce((acc, value, idx) => {
    acc[keys[idx]] = value;
    return acc;
  }, {});
};

const safeKeyValuePairs = arr => {
  if (arr === null || arr === undefined) {
    return arr;
  }
  const mappedArr = arr.slice(2).map(item => mapArrayToObject(item, arr[1]));
  try {
    return mappedArr
      .filter(
        o => isValidValue(o['External ID']) && isValidValue(o['DHIS2 DE UID'])
      )
      .reduce((acc, value) => {
        acc[value['DHIS2 DE UID']] = value['External ID'];
        return acc;
      }, {});
  } catch (error) {
    console.error(`Error processing ${arr}:`, error);
    return arr; // Return original value if processing fails
  }
};

//New OptionSet Mappping
const questionKeyValuePairs = arr => {
  if (arr === null || arr === undefined) {
    return arr;
  }
  const mappedArr = arr.slice(2).map(item => mapArrayToObject(item, arr[1]));
  try {
    return mappedArr
      .filter(
        o =>
          isValidValue(o['External ID']) &&
          isValidValue(o['DHIS2 Option Set UID'])
      )
      .map(value => ({
        [value['DHIS2 Option Set UID']]: value['External ID'],
      }));
  } catch (error) {
    console.error(`Error processing ${arr}:`, error);
    return arr; // Return original value if processing fails
  }
};

fn(state => {
  state.placeOflivingMap = state['Places of living']
    .slice(2)
    .map(item => mapArrayToObject(item, state['Places of living'][1]))
    .filter(
      o =>
        (isValidValue(o['External ID']) &&
          isValidValue(o['DHIS2 DE full name'])) ||
        (isValidValue(o['value.display - Answers']) &&
          isValidValue(o['DHIS2 Option code']))
    )
    .reduce((acc, value) => {
      acc[value['Answers']] = value['DHIS2 Option code'];
      return acc;
    }, {});

  return state;
});

fn(state => {
  const { OptionSets, identifiers } = state;
  const keys = OptionSets[1];

  state.optsMap = OptionSets.slice(2)
    .map(item => mapArrayToObject(item, keys))
    .filter(
      o =>
        (isValidValue(o['External ID']) &&
          isValidValue(o['DHIS2 DE full name'])) ||
        (isValidValue(o['value.display - Answers']) &&
          isValidValue(o['DHIS2 Option code']))
    )
    .map(o => {
      const optionSetUid =
        o['DHIS2 Option Set UID'] == 'NA'
          ? ''
          : `-${o['DHIS2 Option Set UID']}`;
      //then build an answerKeyUid = DEuid + OptionSetUid
      const answerKeyUid = `${o['External ID']}${optionSetUid}`;

      return {
        'DHIS2 Option Set UID': o['DHIS2 Option Set UID'],
        'DHIS2 Option name': o['DHIS2 Option name'],
        'DHIS2 Option UID': o['DHIS2 Option UID'],
        'DHIS2 Option Code': o['DHIS2 Option code'],
        'value.display - Answers': o['Answers'],
        'value.uuid - External ID': o['External ID'],
        answerMappingUid: answerKeyUid,
        'DHIS2 DE full name': o['DHIS2 DE full name'],
        'DHIS2 DE UID': o['DHIS2 DE UID'],
        'OptionSet name': o['OptionSet name'],
        'DHIS2 Option Set name': o['DHIS2 Option Set name'],
      };
    });

  const [iheaders, ...irows] = identifiers;
  state.identifiers = irows
    .map(row =>
      row.reduce((obj, value, index) => {
        if (value != null && value !== '') {
          obj[iheaders[index]] = value;
        }
        return obj;
      }, {})
    )
    .filter(obj => Object.keys(obj).length > 0);
  return state;
});

fn(state => {
  const { formMetadata, optsMap, identifiers, placeOflivingMap } = state;

  const formMaps = formMetadata.reduce((acc, form) => {
    const formName = form['OMRS form sheet name'];
    acc[form['OMRS form.uuid']] = {
      formName,
      orgUnit: form['DHIS2 orgUnit ID'],
      programId: form['DHIS2 program ID'],
      programStage: form['DHIS2 programStage ID'],
      dataValueMap: safeKeyValuePairs(state[formName]),
      optionSetMap: questionKeyValuePairs(state[formName]),
    };

    return acc;
  }, {});

  const optionSetKey = Object.entries(formMaps).reduce(
    (acc, [formKey, formValue]) => {
      // Iterate over each object in the optionSetMap array
      formValue.optionSetMap.forEach(item => {
        // Extract the single key-value pair from each object in the array
        const [originalKey, originalValue] = Object.entries(item)[0];
        // Reverse key-value, adding form prefix
        acc[`${formKey}-${originalValue}`] = originalKey;
      });
      return acc;
    },
    {}
  );

  // const optionSetKey = Object.entries(formMaps).reduce((acc, [formKey, formValue]) => {
  //   // Iterate over each optionSetMap entry and reverse key-value, adding form prefix
  //   Object.entries(formValue.optionSetMap).forEach(([originalKey, originalValue]) => {
  //     acc[`${formKey}-${originalValue}`] = originalKey;
  //   });
  //   return acc;
  // }, {})

  return {
    formMaps,
    formMetadata,
    optsMap,
    optionSetKey,
    identifiers,
    placeOflivingMap,
  };
});
