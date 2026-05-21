import { get } from "@openfn/language-dhis2";

export const findDuplicatePatient = (teis) => {
  const seen = new Map();
  const duplicates = new Set();

  teis.forEach((tei) => {
    const patientNumber = tei.attributes.find(
      (attr) => attr.code === "patient_number"
    )?.value;

    if (seen.get(patientNumber)) {
      duplicates.add(patientNumber);
    } else {
      seen.set(patientNumber, tei);
    }
  });

  return duplicates;
};
