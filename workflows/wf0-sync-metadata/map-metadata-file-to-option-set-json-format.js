export const isValidValue = (value) => value !== "" && value !== "NA";

export const mapArrayToObject = (item, keys) => {
  return item.reduce((acc, value, idx) => {
    acc[keys[idx]] = value;
    return acc;
  }, {});
};

export const safeKeyValuePairs = (arr) => {
  if (arr === null || arr === undefined) {
    return arr;
  }
  const mappedArr = arr.slice(2).map((item) => mapArrayToObject(item, arr[1]));
  try {
    return mappedArr
      .filter(
        (o) => isValidValue(o["External ID"]) && isValidValue(o["DHIS2 DE UID"])
      )
      .reduce((acc, value) => {
        const key = `${value["External ID"]}::${value["DHIS2 type"].toLowerCase()}`;
        acc[value["DHIS2 DE UID"]] = value["Question ID"]
          ? `${key}::${value["Question ID"]}`
          : key;
        return acc;
      }, {});
  } catch (error) {
    console.error(`Error processing ${arr}:`, error);
    return arr; // Return original value if processing fails
  }
};

export const extractMultiQns = (arr) => {
  if (arr === null || arr === undefined) {
    return arr;
  }
  const mappedArr = arr.slice(2).map((item) => mapArrayToObject(item, arr[1]));
  try {
    const multiSelectQuestions = mappedArr
      .filter((o) => isValidValue(o["Question #"]))
      .reduce((acc, value) => {
        if (value["Multi-Select Answer External IDs"]) {
          if (!acc[value["Question #"]]) {
            acc[value["Question #"]] = {
              extId: value["External ID"],
              qid: value["Question ID"],
              qns: [
                {
                  clde: value["CL DHIS2 DE UID"],
                  type: value["DHIS2 type"],
                  multiAns: value["Multi-Select Answer External IDs"],
                },
              ],
            };
          } else {
            acc[value["Question #"]].qns.push({
              clde: value["CL DHIS2 DE UID"],
              type: value["DHIS2 type"],
              multiAns: value["Multi-Select Answer External IDs"],
            });
          }
        }

        return acc;
      }, {});
    return Object.values(multiSelectQuestions);
  } catch (error) {
    console.error(`Error processing ${arr}:`, error);
    return arr; // Return original value if processing fails
  }
};

//New OptionSet Mappping
export const questionKeyValuePairs = (arr) => {
  if (arr === null || arr === undefined) {
    return arr;
  }
  const mappedArr = arr.slice(2).map((item) => mapArrayToObject(item, arr[1]));
  try {
    return mappedArr
      .filter(
        (o) =>
          isValidValue(o["External ID"]) &&
          isValidValue(o["DHIS2 Option Set UID"])
      )
      .map((value) => ({
        [value["DHIS2 Option Set UID"]]: value["Question ID"]
          ? `${value["External ID"]}-${value["Question ID"]}`
          : value["External ID"],
      }));
  } catch (error) {
    console.error(`Error processing ${arr}:`, error);
    return arr; // Return original value if processing fails
  }
};

fn((state) => {
  state.placeOflivingMap = state["Places of living"]
    .slice(2)
    .map((item) => mapArrayToObject(item, state["Places of living"][1]))
    .filter(
      (o) =>
        (isValidValue(o["External ID"]) &&
          isValidValue(o["DHIS2 DE full name"])) ||
        (isValidValue(o["value.display - Answers"]) &&
          isValidValue(o["DHIS2 Option code"]))
    )
    .reduce((acc, value) => {
      acc[value["Answers"]] = value["DHIS2 Option code"];
      return acc;
    }, {});

  return state;
});

fn((state) => {
  const { OptionSets, identifiers } = state;
  const keys = OptionSets[1];

  state.optsMap = OptionSets.slice(2)
    .map((item) => mapArrayToObject(item, keys))
    .filter(
      (o) =>
        (isValidValue(o["External ID"]) &&
          isValidValue(o["DHIS2 DE full name"])) ||
        (isValidValue(o["value.display - Answers"]) &&
          isValidValue(o["DHIS2 Option code"]))
    )
    .map((o) => {
      return {
        "DHIS2 Option Set UID": o["DHIS2 Option Set UID"],
        "DHIS2 Option name": o["DHIS2 Option name"],
        "DHIS2 Option UID": o["DHIS2 Option UID"],
        "DHIS2 Option Code": o["DHIS2 Option code"],
        "value.display - Answers": o["Answers"],
        "value.uuid - External ID": o["External ID"].trim(),
        "DHIS2 DE UID": o["DHIS2 DE UID"],
      };
    });

  const [iheaders, ...irows] = identifiers;
  state.identifiers = irows
    .map((row) =>
      row.reduce((obj, value, index) => {
        if (value != null && value !== "") {
          obj[iheaders[index]] = value;
        }
        return obj;
      }, {})
    )
    .filter((obj) => Object.keys(obj).length > 0);
  return state;
});

fn((state) => {
  const {
    optsMap,
    syncedAt,
    lastSync,
    targetFile,
    identifiers,
    formMetadata,
    placeOflivingMap,
  } = state;

  const sourceFile = targetFile.name;
  const fileDateModified = targetFile.lastModifiedDateTime;

  const formMaps = formMetadata.reduce((acc, form) => {
    const formName = form["OMRS form sheet name"];
    acc[form["OMRS form.uuid"]] = {
      formName,
      syncType: form["Sync Type"],
      orgUnit: form["DHIS2 orgUnit ID"],
      programId: form["DHIS2 program ID"],
      programStage: form["DHIS2 programStage ID"],
      dataValueMap: safeKeyValuePairs(state[formName]),
      optionSetMap: questionKeyValuePairs(state[formName]),
      workflow: form["Workflow"],
      relationshipId: form["DHIS2 TEI Relationship Id"],
      orgUnit: form["DHIS2 Org Unit ID"],
      multiSelectQns: extractMultiQns(state[formName]),
    };

    return acc;
  }, {});

  const optionSetKey = Object.entries(formMaps).reduce(
    (acc, [formKey, formValue]) => {
      formValue.optionSetMap.forEach((item) => {
        const [originalKey, originalValue] = Object.entries(item)[0];
        acc[`${formKey}-${originalValue}`] = originalKey;
      });
      return acc;
    },
    {}
  );

  return {
    lastSync,
    syncedAt,
    formMaps,
    optsMap,
    sourceFile,
    identifiers,
    formMetadata,
    optionSetKey,
    fileDateModified,
    placeOflivingMap,
  };
});
