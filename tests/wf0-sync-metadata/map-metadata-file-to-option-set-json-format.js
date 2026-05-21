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
