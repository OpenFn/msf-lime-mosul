// Patient Attributes
const genderAttr = "qptKDiv9uPl";
const ageInMonthsAttr = "ihH5ur7jquC";
const ageInYearsAttr = "T1iX2NuPyqS";
const currentStatusAttr = "YUIQIA2ClN6";
const legalStatusAttr = "Qq6xQ2s6LO8";
const placeOfLivingAttr = "rBtrjV1Mqkz";
const nationalityAttr = "Xvzc9e0JJmp";
const patientNoAttr = "P4wdYGkldeG";
const dobAttr = "WDp4nVor9Z7";

const MILLISECONDS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
const calculateAge = (dob) =>
  Math.floor((new Date() - new Date(dob)) / MILLISECONDS_PER_YEAR);

const teiAge = (tei) => {
  let age = tei?.attributes?.find(
    (attr) => attr.attribute === ageInYearsAttr
  )?.value;

  if (!age) {
    const birthdate = tei?.attributes?.find(
      (attr) => attr.attribute === dobAttr
    )?.value;
    age = calculateAge(birthdate);
  }
  return age;
};

const formIdByName = (name, formMaps) => {
  const entry = Object.entries(formMaps).find(([formId, form]) =>
    form.formName.includes(name)
  );
  return entry ? entry[0] : null;
};

const ageInDays = (dob, encounterDate) => {
  const birth = new Date(dob);
  const encounter = new Date(encounterDate);
  const diffTime = Math.abs(encounter - birth);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

function f8(encounter) {
  const obsDatetime = findObsByConcept(
    encounter,
    "7f00c65d-de60-467a-8964-fe80c7a85ef0"
  )?.value;

  if (obsDatetime) {
    const datePart = obsDatetime.substring(0, 10);
    const timePart = obsDatetime.substring(11, 16);
    return [
      {
        dataElement: "iQio7NYSA3m",
        value: timePart,
      },
      // {
      //   dataElement: "yprMS34o8s3",
      //   value: datePart,
      // }, //This mapping might have been removed, to be confirmed.
    ];
  }
  return [];
}

function f27(encounter) {
  const admissionDate = findObsByConcept(
    encounter,
    "7f00c65d-de60-467a-8964-fe80c7a85ef0"
  )?.value;
  if (!admissionDate) return [];
  const timePart = admissionDate.substring(11, 16);
  const datePart = admissionDate.replace("+0000", "");
  return [
    {
      dataElement: "eYvDzr2m8f5",
      value: timePart,
    },
    {
      eventDate: datePart,
    },
  ];
}

function f23(encounter) {
  // Define concept mappings object for cleaner reference
  const CONCEPT_ID = "f587c6a3-6a71-48ae-83b2-5e2417580b6f";

  const conditions = [
    {
      // 'Neonatal infection in previous pregnancy' is selected in OMRS
      dataElement: "H9noxo3e7ox",
      valueId: "09d6bb71-b061-4cae-85f3-2ff020a10c92",
    },
    {
      // 'Mother got antibiotics during delivery/post-partum ' is selected in OMRS
      dataElement: "GfN1TtpqDoJ",
      valueId: "3764bd79-9ae2-478a-88e7-51adc0a8a2e3",
    },
    {
      //'Infection in other baby if multiple pregnancy' is selected in OMRS
      dataElement: "WS1p4xgbZqU",
      valueId: "95d55453-060b-43a2-b4a0-11848dd9ac72",
    },
    {
      //'Maternal fever during labour' is selected in OMRS
      dataElement: "WX19iDuB4Dj",
      valueId: "890f4bdb-91bc-484c-a9cf-17f5068b0507",
    },
    {
      // 'Rupture of membranes ≥18h' is selected in OMRS
      dataElement: "eLKs6GUHJdS",
      valueId: "28d10ce0-7f72-4654-834d-64fa37ad8e85",
    },
    {
      // 'Pre-labour rupture of membranes <18h' is selected in OMRS
      dataElement: "hCfngwimBjX",
      valueId: "cf48d000-a741-44e0-81cb-a51f88595e41",
    },
    {
      // 'Smelling/cloudy amniotic fluid' is selected in OMRS
      dataElement: "qc7ubAwULxs",
      valueId: "49829d18-22c9-404c-a79a-49ed6b21d2be",
    },
  ];

  // Map through conditions and create final mapping
  return conditions.map((condition) => ({
    dataElement: condition.dataElement,
    value: findByConceptAndValue(encounter, CONCEPT_ID, condition.valueId)
      ? true
      : undefined,
  }));
}

function f26(encounter, optsMap, optionSetKey) {
  const antimalariaType = filterObsByConcept(
    encounter,
    "8afa4dfc-b2af-452c-b402-4b96b0f334b4"
  );

  if (antimalariaType.length > 1) {
    const { value, concept, formFieldPath } = antimalariaType[1];
    const optionKey = `${encounter.form.uuid}-${concept.uuid}-${formFieldPath}`;
    const matchingOptionSet = optionSetKey[optionKey];
    const opt = optsMap.find(
      (o) =>
        o["value.uuid - External ID"] === value.uuid &&
        o["value.display - Answers"] == value.display
      // o["DHIS2 Option Set UID"] === matchingOptionSet // TODO: @Aisha to confirm with Ludovic, No matching option set found for this concept
    );

    return [
      {
        dataElement: "GUiSgvbwUyc",
        value: opt?.["DHIS2 Option Code"],
      },
    ];
  } else if (antimalariaType.length === 1) {
    const { value, concept, formFieldPath } = antimalariaType[0];

    const optionKey = `${encounter.form.uuid}-${concept.uuid}-${formFieldPath}`;
    const matchingOptionSet = optionSetKey[optionKey];
    const opt = optsMap.find(
      (o) =>
        o["value.uuid - External ID"] === value.uuid &&
        o["value.display - Answers"] == value.display
      // o["DHIS2 Option Set UID"] === matchingOptionSet
    );
    return [
      {
        dataElement: "F6C5WnGoj5r",
        value: opt?.["DHIS2 Option Code"],
      },
    ];
  }
  return [];
}
function f41(encounter) {
  const obsDatetime = findObsByConcept(
    encounter,
    "40108bf5-0bbd-42e8-8102-bcbd0550a943"
  )?.value;
  if (!obsDatetime) return [];
  // what is obsdatetime?
  //TODO: extract time componenet and assign
  //TODO: set date component to eventDate attribute
  //TODO: use that when setting OccuredAt
  //TODO: Apply the same changes for f27
  const timePart = obsDatetime.substring(11, 16);
  const datePart = obsDatetime.replace("+0000", "");

  return [
    {
      dataElement: "gluXfK7zg1d",
      value: timePart,
    },
    {
      dataElement: "bkissws06TK",
      value: timePart,
    },
    {
      eventDate: datePart,
    },
  ];
}

function f42(encounter) {
  const obsDatetime = findObsByConcept(
    encounter,
    "7f00c65d-de60-467a-8964-fe80c7a85ef0"
  )?.value;
  if (!obsDatetime) return [];

  return [
    {
      dataElement: "xr2Dqw14DGX",
      value: obsDatetime,
    },
  ];
}

function f26(encounter, optsMap, optionSetKey) {
  const antimalariaType = filterObsByConcept(
    encounter,
    "8afa4dfc-b2af-452c-b402-4b96b0f334b4"
  );

  if (antimalariaType.length > 1) {
    const { value, concept, formFieldPath } = antimalariaType[1];
    const optionKey = `${encounter.form.uuid}-${concept.uuid}-${formFieldPath}`;
    const matchingOptionSet = optionSetKey[optionKey];
    const opt = optsMap.find(
      (o) =>
        o["value.uuid - External ID"] === value.uuid &&
        o["value.display - Answers"] == value.display
      // o["DHIS2 Option Set UID"] === matchingOptionSet // TODO: @Aisha to confirm with Ludovic, No matching option set found for this concept
    );

    return [
      {
        dataElement: "GUiSgvbwUyc",
        value: opt?.["DHIS2 Option Code"],
      },
    ];
  } else if (antimalariaType.length === 1) {
    const { value, concept, formFieldPath } = antimalariaType[0];

    const optionKey = `${encounter.form.uuid}-${concept.uuid}-${formFieldPath}`;
    const matchingOptionSet = optionSetKey[optionKey];
    const opt = optsMap.find(
      (o) =>
        o["value.uuid - External ID"] === value.uuid &&
        o["value.display - Answers"] == value.display
      // o["DHIS2 Option Set UID"] === matchingOptionSet
    );
    return [
      {
        dataElement: "F6C5WnGoj5r",
        value: opt?.["DHIS2 Option Code"],
      },
    ];
  }
  return [];
}

function f43(encounter, tei) {
  const mappings = [];
  const obsDatetime = findObsByConcept(
    encounter,
    "88472a4e-f26e-4235-8144-4ad6df874949"
  )?.value;

  const birthdate = tei?.attributes?.find(
    (attr) => attr.attribute === dobAttr
  )?.value;

  if (obsDatetime) {
    const datePart = obsDatetime.substring(0, 10);
    const timePart = obsDatetime.substring(11, 16);
    mappings.push(
      {
        dataElement: "tR7XL9TPVkr",
        value: datePart,
      },
      {
        dataElement: "P8bmDESxYqn",
        value: timePart,
      }
    );
  }

  if (birthdate) {
    mappings.push({
      dataElement: "Z2RzJFkXzII",
      value: ageInDays(birthdate, encounter.encounterDatetime),
    });
  }
  return mappings;
}

function f64(encounter) {
  const admissionTime = findObsByConcept(
    encounter,
    "7f00c65d-de60-467a-8964-fe80c7a85ef0"
  )?.value;

  if (!admissionTime) return [];

  const timePart = admissionTime.substring(11, 16);

  return [
    {
      dataElement: "KDZguOxdsZk",
      value: timePart,
    },
  ];
}

function f65(encounter) {
  const mappings = [];

  // Discharge date and time
  const dischargeDateTime = findObsByConcept(
    encounter,
    "d92dd800-b048-4724-86fa-91d006f9caa8"
  )?.value;

  if (dischargeDateTime) {
    const datePart = dischargeDateTime.substring(0, 10);
    const timePart = dischargeDateTime.substring(11, 16);
    mappings.push(
      {
        dataElement: "GwlaaueZOz1",
        value: datePart,
      },
      {
        dataElement: "Me7I97tO6lt",
        value: timePart,
      }
    );
  }

  // Complications concept
  const COMPLICATIONS_CONCEPT = "ec9ffc6e-22c9-4489-ab88-c517460e7838";
  const complications = [
    {
      dataElement: "L62vj1GgiN7", // ICU - None
      valueId: "5622AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", // None of the above
    },
    {
      dataElement: "B7ctRMMlWe3", // ICU - Unplanned Extubation
      valueId: "c5c533fa-8f4a-456b-951c-5b8a5bb00e05",
    },
    {
      dataElement: "iqCyxY3eNeT", // ICU - Decubitus Ulcer
      valueId: "46a4ca47-1381-45cb-a7c7-97e06b3bb168",
    },
    {
      dataElement: "ww7USwFQj2z", // ICU - Ventilation associated pneumonia
      valueId: "78f6f3cf-2c94-4abc-ac4d-8c8ec81bb7f5",
    },
    {
      dataElement: "Z4jDd6xDrxe", // ICU - Deep vein thrombosis/Pulmonary embolism
      valueId: "7a49b7aa-fa51-4d09-b4c0-b04ca14aebf3",
    },
    {
      dataElement: "PIpSxyJQbLF", // ICU - Nosocomial infection
      valueId: "25b98ce2-c866-4501-ac30-fb8df65c62a3",
    },
    {
      dataElement: "vpHMZZUHfbu", // ICU - Other complications
      valueId: "5622AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", // Other
    },
  ];

  complications.forEach((complication) => {
    mappings.push({
      dataElement: complication.dataElement,
      value: findByConceptAndValue(
        encounter,
        COMPLICATIONS_CONCEPT,
        complication.valueId
      )
        ? true
        : false,
    });
  });

  // Procedures concept
  const PROCEDURES_CONCEPT = "d3ffa682-10ab-41f3-8965-d5835028ddf1";
  const procedures = [
    {
      dataElement: "sPriwz5Vako", // ICU - Oxygen Therapy
      valueId: "7ecb6e96-df13-4aa5-a8c5-c9fbbf04cb7e",
    },
    {
      dataElement: "KloAvz2tRpF", // ICU - Mechanical Ventilation
      valueId: "68fe4a3e-b2f5-4898-9b3d-47b5ae4e2760",
    },
    {
      dataElement: "iU2p3jBkH1g", // ICU - Non-Invasive Ventilation
      valueId: "b8f0fac8-0e9b-4e31-bc18-fa29e5af4d52",
    },
    {
      dataElement: "hkpsGWvEiej", // ICU - Continuous IV vasoactive drug
      valueId: "5ee8cc97-1f94-4f3c-98c4-2c3b61e67d97",
    },
    {
      dataElement: "f2xBCTPwHVe", // ICU - Blood transfusion
      valueId: "8e8a55e9-4a88-407e-95c7-2f9dc2d8e82b",
    },
    {
      dataElement: "ou5F3XrcCtP", // ICU - PICC
      valueId: "8c8b2a77-a9ad-4e3e-b09a-6a5ed8dc98e7",
    },
    {
      dataElement: "lLsqleVmjxM", // ICU - CVC
      valueId: "2d7ad5e6-d2d3-49b4-a7ce-99e3e8a4a60b",
    },
    {
      dataElement: "vEHfWvx3jOC", // ICU - Anti venom infusion
      valueId: "5a7e8f33-2a9c-4d8b-bd47-1c6a9e4f8e99",
    },
    {
      dataElement: "AMzXzgYijsf", // ICU - Dialysis
      valueId: "3c9a0f7e-6b8d-4e2a-9f4c-8d7e6f5a4b3c",
    },
    {
      dataElement: "uhwPdlg1Xks", // ICU - CPR
      valueId: "9f8e7d6c-5b4a-3e2d-1c0b-9a8f7e6d5c4b",
    },
    {
      dataElement: "wpKbq1yqNO4", // ICU - HFNO
      valueId: "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
    },
    {
      dataElement: "MHw1oo8gzo0", // ICU - Tracheotomy
      valueId: "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
    },
    {
      dataElement: "Uarx1aREhTg", // ICU - Thoracostomy
      valueId: "3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7a8b",
    },
    {
      dataElement: "aVhxpjsmOkN", // ICU - Enteral nutrition
      valueId: "9a0b1c2d-3e4f-5a6b-7c8d-9e0f1a2b3c4d",
    },
    {
      dataElement: "W0Zmd91Q2Mq", // ICU - Parenteral nutrition
      valueId: "5c6d7e8f-9a0b-1c2d-3e4f-5a6b7c8d9e0f",
    },
    {
      dataElement: "GLJMjayu3Zq", // ICU - Sedation
      valueId: "1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
    },
    {
      dataElement: "xpexnMzz7wT", // ICU - Urinary Catheter
      valueId: "7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
    },
    {
      dataElement: "hAApnBIte8S", // ICU - Suprapubic catheter
      valueId: "3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f",
    },
    {
      dataElement: "ZMKPdgE2cfE", // ICU - Intubation
      valueId: "9c0d1e2f-3a4b-5c6d-7e8f-9a0b1c2d3e4f",
    },
    {
      dataElement: "berKerGzX50", // ICU - Defibrillation
      valueId: "5e6f7a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b",
    },
    {
      dataElement: "vf1JXjASSAM", // ICU - X-Ray
      valueId: "1e2f3a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b",
    },
    {
      dataElement: "txeDsVSjlBi", // ICU - Ultrasound
      valueId: "7e8f9a0b-1c2d-3e4f-5a6b-7c8d9e0f1a2b",
    },
  ];

  procedures.forEach((procedure) => {
    mappings.push({
      dataElement: procedure.dataElement,
      value: findByConceptAndValue(
        encounter,
        PROCEDURES_CONCEPT,
        procedure.valueId
      )
        ? true
        : false,
    });
  });

  return mappings;
}

function f66(encounter) {
  const mappings = [];

  // Risk factors concept
  const RISK_FACTORS_CONCEPT = "b5598ad3-b010-4b78-a47f-944062c8d46c";
  const riskFactors = [
    {
      dataElement: "q3Ofs4sb4sB", // Snakebites - Diabetes
      valueId: "119481AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "fBJUOZut8pW", // Snakebites - Immune deficiency
      valueId: "116030AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "OKMBuzHnIOF", // Snakebites - Other risk factor
      valueId: "5622AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "Ue3P1jYqPZv", // Snakebites - Pregnant
      valueId: "1434AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
  ];

  riskFactors.forEach((rf) => {
    mappings.push({
      dataElement: rf.dataElement,
      value: findByConceptAndValue(encounter, RISK_FACTORS_CONCEPT, rf.valueId)
        ? true
        : false,
    });
  });

  // Signs and symptoms concept
  const SIGNS_SYMPTOMS_CONCEPT = "5f683542-233e-47c2-b06e-69d2a639a78b";
  const WBCT_CONCEPT = "09fdc8a7-91a7-409d-81f1-7bcb8650c5a6";

  // Cytotoxic signs mapping
  const dryBite = findByConceptAndValue(
    encounter,
    SIGNS_SYMPTOMS_CONCEPT,
    "1107AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" // Dry bite UUID
  );
  const mildCytotoxic = findByConceptAndValue(
    encounter,
    SIGNS_SYMPTOMS_CONCEPT,
    "164085AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" // Mild cytotoxic UUID
  );
  const severeCytotoxic = findByConceptAndValue(
    encounter,
    SIGNS_SYMPTOMS_CONCEPT,
    "164086AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" // Severe cytotoxic UUID
  );

  // Map Cytotoxic signs
  if (dryBite) {
    mappings.push({
      dataElement: "bRpRhiyU9om",
      value: "oARwiGgobcd", // Dry bite option code
    });
  } else if (mildCytotoxic) {
    mappings.push({
      dataElement: "bRpRhiyU9om",
      value: "h1twBaWpKPF", // Mild cytotoxic option code
    });
  } else if (severeCytotoxic) {
    mappings.push({
      dataElement: "bRpRhiyU9om",
      value: "Tz3eOWkiFPW", // Severe cytotoxic option code
    });
  }

  // Hematotoxic signs - complex logic
  const bleeding = findByConceptAndValue(
    encounter,
    SIGNS_SYMPTOMS_CONCEPT,
    "147241AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" // Bleeding UUID
  );
  const notClotting = findByConceptAndValue(
    encounter,
    WBCT_CONCEPT,
    "164089AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" // Not clotting UUID
  );
  const clotting = findByConceptAndValue(
    encounter,
    WBCT_CONCEPT,
    "162830AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" // Clotting UUID
  );

  if (bleeding && !notClotting) {
    mappings.push({
      dataElement: "etjys3ZhdrZ",
      value: "TL1JkvBhwZj", // Bleeding code
    });
  } else if (!bleeding && notClotting) {
    mappings.push({
      dataElement: "etjys3ZhdrZ",
      value: "C9YeFTRG7hR", // Not clotting code
    });
  } else if (bleeding && notClotting) {
    mappings.push({
      dataElement: "etjys3ZhdrZ",
      value: "C08j0szZSKz", // Both code
    });
  } else if (!bleeding && clotting) {
    mappings.push({
      dataElement: "etjys3ZhdrZ",
      value: "aNsED3NFbns", // No code
    });
  }

  // Other signs and symptoms (TRUE/FALSE mappings)
  const otherSymptoms = [
    {
      dataElement: "XySb2gCahXO", // Ptosis
      valueId: "127652AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "RrkIQOnbDIc", // Diplopia
      valueId: "118872AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "btIVSyaMjxo", // Respiratory paralysis
      valueId: "206AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "s6QE9wvp7du", // Hypotension
      valueId: "2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "RemTrHYTqH5", // Shock
      valueId: "120AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "FhPg5pjDE0x", // Arrhythmia
      valueId: "120148AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "f6APbHzeij1", // Vomiting
      valueId: "122983AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "unqnutWNMZY", // Diarrhoea
      valueId: "142412AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "HpBtLYscppW", // Tachycardia
      valueId: "141830AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "H3Bh7PfpIfC", // Fever
      valueId: "140238AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "BWMEAA6HeOp", // Hypoperfusion
      valueId: "127639AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "CI9jbvFDiQq", // Hypoxia
      valueId: "141497AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "zvnvyevgjMw", // Altered consciousness
      valueId: "120345AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
  ];

  otherSymptoms.forEach((symptom) => {
    mappings.push({
      dataElement: symptom.dataElement,
      value: findByConceptAndValue(
        encounter,
        SIGNS_SYMPTOMS_CONCEPT,
        symptom.valueId
      )
        ? true
        : false,
    });
  });

  // Signs and symptoms evolution (6h exit) - same logic as above but different data elements
  // Cytotoxic evolution
  if (dryBite) {
    mappings.push({
      dataElement: "uZOKOcCGHqE",
      value: "oARwiGgobcd",
    });
  } else if (mildCytotoxic) {
    mappings.push({
      dataElement: "uZOKOcCGHqE",
      value: "h1twBaWpKPF",
    });
  } else if (severeCytotoxic) {
    mappings.push({
      dataElement: "uZOKOcCGHqE",
      value: "Tz3eOWkiFPW",
    });
  }

  // Hematotoxic evolution
  if (bleeding && !notClotting) {
    mappings.push({
      dataElement: "kFjWm5ZYkS2",
      value: "TL1JkvBhwZj",
    });
  } else if (!bleeding && notClotting) {
    mappings.push({
      dataElement: "kFjWm5ZYkS2",
      value: "C9YeFTRG7hR",
    });
  } else if (bleeding && notClotting) {
    mappings.push({
      dataElement: "kFjWm5ZYkS2",
      value: "C08j0szZSKz",
    });
  } else if (!bleeding && clotting) {
    mappings.push({
      dataElement: "kFjWm5ZYkS2",
      value: "aNsED3NFbns",
    });
  }

  // Other evolution symptoms
  const evolutionSymptoms = [
    {
      dataElement: "RE55naGtgeR",
      valueId: "127652AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    }, // Ptosis
    {
      dataElement: "A2FtERcITXf",
      valueId: "118872AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    }, // Diplopia
    {
      dataElement: "E9t4MkYI7y6",
      valueId: "206AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    }, // Respiratory paralysis
    {
      dataElement: "CY6nPuLtUuc",
      valueId: "2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    }, // Hypotension
    {
      dataElement: "kAKH96OxZnd",
      valueId: "120AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    }, // Shock
    {
      dataElement: "G3RL6izz9sF",
      valueId: "120148AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    }, // Arrhythmia
    {
      dataElement: "gU9j2VsDgHR",
      valueId: "122983AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    }, // Vomiting
    {
      dataElement: "A0tGqfX9mND",
      valueId: "142412AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    }, // Diarrhoea
    {
      dataElement: "yB1GPiDglMU",
      valueId: "141830AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    }, // Tachycardia
    {
      dataElement: "YbHZEW4crvo",
      valueId: "140238AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    }, // Fever
    {
      dataElement: "sKIL8nyk2N9",
      valueId: "127639AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    }, // Hypoperfusion
    {
      dataElement: "WPAIWO2vewI",
      valueId: "141497AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    }, // Hypoxia
    {
      dataElement: "SYJSMoZluue",
      valueId: "120345AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    }, // Altered consciousness
  ];

  evolutionSymptoms.forEach((symptom) => {
    mappings.push({
      dataElement: symptom.dataElement,
      value: findByConceptAndValue(
        encounter,
        SIGNS_SYMPTOMS_CONCEPT,
        symptom.valueId
      )
        ? true
        : false,
    });
  });

  // Treatment received
  const TREATMENT_CONCEPT = "d6081b93-291a-4349-a1c7-8a11e7326de1";
  const treatments = [
    {
      dataElement: "ZNsI6T2XszG", // IV Ringer infusion
      valueId: "351AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "H524DgPrx4z", // Adrenalin
      valueId: "71AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "ldZrNC0BRBH", // Antihistaminic
      valueId: "73AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "v7W0sMo5QQq", // Oxygen
      valueId: "165727AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "L8C2QUwxTOE", // TT vaccination
      valueId: "84AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "UNVy4BegAeE", // Debridement / fasciotomy
      valueId: "163589AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "xRDQ7ThkOZ1", // Amputation
      valueId: "165138AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
  ];

  treatments.forEach((treatment) => {
    mappings.push({
      dataElement: treatment.dataElement,
      value: findByConceptAndValue(
        encounter,
        TREATMENT_CONCEPT,
        treatment.valueId
      )
        ? true
        : false,
    });
  });

  // Adverse events
  const ADVERSE_EVENTS_CONCEPT = "8b8140b1-e9da-4df8-b299-c36c9a639d1a";
  const adverseEvents = [
    {
      dataElement: "o8nuGMe80AG", // Skin
      valueId: "148888AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "SKRQf0vb5jF", // Gastrointestinal
      valueId: "139581AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "Lbf16HisQkb", // Respiratory
      valueId: "5960AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "b0Pdzwpv7xh", // Circulatory
      valueId: "130AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "yozce7B8SyI", // High temp >38°
      valueId: "140238AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "cbQ1F9AeB3w", // Serum sickness
      valueId: "148035AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "gjUuh9rBfSZ", // PTSD
      valueId: "143666AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "d2U12mItsDC", // Wound needing chronic care
      valueId: "165757AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "eFGydcHLkIQ", // Severe necrosis + disability
      valueId: "118771AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "eK5K7hGzVIU", // Cardiac
      valueId: "119270AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "qWq8p9M0OFn", // Other
      valueId: "5622AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
  ];

  adverseEvents.forEach((ae) => {
    mappings.push({
      dataElement: ae.dataElement,
      value: findByConceptAndValue(
        encounter,
        ADVERSE_EVENTS_CONCEPT,
        ae.valueId
      )
        ? true
        : false,
    });
  });

  return mappings;
}

function mapAttribute(attributes, attributeMap) {
  const attrMapping = Object.entries(attributeMap)
    .map(([dataElement, attributeId]) => {
      const value = attributes?.find(
        (attr) => attr.attribute === attributeId
      )?.value;

      return { dataElement, value };
    })
    .filter(Boolean);

  return attrMapping;
}

const findObsByConcept = (encounter, conceptUuid) => {
  const [conceptId, questionId] = conceptUuid.split("-rfe-");
  const answer = encounter.obs.find(
    (o) =>
      o.concept.uuid === conceptId &&
      (questionId ? o.formFieldPath === `rfe-${questionId}` : true)
  );

  return answer;
};

const filterObsByConcept = (encounter, conceptUuid) => {
  const [conceptId, questionId] = conceptUuid.split("-rfe-");
  const answers = encounter.obs.filter(
    (o) =>
      o.concept.uuid === conceptId &&
      (questionId ? o.formFieldPath === `rfe-${questionId}` : true)
  );
  return answers;
};
const findByConceptAndValue = (encounter, conceptUuid, value) => {
  const [conceptId, questionId] = conceptUuid.split("-rfe-");
  const answer = encounter.obs.find(
    (o) =>
      o.concept.uuid === conceptId &&
      (questionId ? o.formFieldPath === `rfe-${questionId}` : true) &&
      o.value.uuid === value
  );
  return answer;
};

const findDataValue = (encounter, dataElement, metadataMap) => {
  if (dataElement === "H9noxo3e7ox") {
    return;
  }
  const { optsMap, optionSetKey, form } = metadataMap;
  const [conceptUuid, questionId] =
    form.dataValueMap[dataElement]?.split("-rfe-");
  const answer = encounter.obs.find((o) => o.concept.uuid === conceptUuid);
  const isObjectAnswer = answer && typeof answer.value === "object";
  const isStringAnswer = answer && typeof answer.value === "string";
  const isNumberAnswer = answer && typeof answer.value === "number";

  if (isStringAnswer || isNumberAnswer) {
    return answer.value;
  }

  if (isObjectAnswer) {
    const optionKey = questionId
      ? `${encounter.form.uuid}-${answer.concept.uuid}-rfe-${questionId}`
      : `${encounter.form.uuid}-${answer.concept.uuid}`;
    const matchingOptionSet = optionSetKey[optionKey];

    const opt = optsMap.find(
      (o) =>
        o["value.uuid - External ID"] === answer.value.uuid &&
        o["DHIS2 Option Set UID"] === matchingOptionSet
    );
    // TODO: Remove this log on prod
    if (!matchingOptionSet) {
      console.log("No matching option set found for ", {
        dataElement,
        qn: answer.concept.display,
        ansUuid: answer.value.uuid,
        ansDisplay: answer.value.display,
      });
    }
    // TODO: Remove this log on prod
    if (!opt && matchingOptionSet) {
      console.log("No Option found for ", {
        dataElement,
        qn: answer.concept.display,
        ansUuid: answer.value.uuid,
        ansDisplay: answer.value.display,
        matchingOptionSet,
      });
    }
    const matchingOption =
      opt?.["DHIS2 Option Code"] ||
      opt?.["DHIS2 Option name"] || // TODO: Sync with AK: We have added this because  Opticon Code is empty in some cases.
      answer?.value?.display; //TODO: revisit this logic if optionSet not found

    // console.log({ matchingOptionSet, opt, matchingOption });
    // If we get errors on true/false, yes/no mappings remove && !matchingOptionSet
    if (["FALSE", "No"].includes(matchingOption) && !matchingOptionSet)
      return "false";
    if (["TRUE", "Yes"].includes(matchingOption) && !matchingOptionSet)
      return "true";

    return matchingOption;
  }

  const isEncounterDate =
    conceptUuid === "encounter-date" &&
    ["CXS4qAJH2qD", "I7phgLmRWQq", "yUT7HyjWurN", "EOFi7nk2vNM"].includes(
      dataElement
    );

  // These are data elements for encounter date in DHIS2
  // F29 MHPSS Baseline v2, F31-mhGAP Baseline v2, F30-MHPSS Follow-up v2, F32-mhGAp Follow-up v2
  if (isEncounterDate) {
    return encounter.encounterDatetime.replace("+0000", "");
  }

  return "";
};

const buildDataValues = (encounter, tei, mappingConfig) => {
  const {
    optsMap,
    optionSetKey,
    dhis2Map,
    form,
    f08Form,
    f09Form,
    f23Form,
    f24Form,
    f25Form,
    f26Form,
    f27Form,
    f28Form,
    f41Form,
    f42Form,
    f43Form,
    f64Form,
    f65Form,
    f66Form,
    f67Form,
  } = mappingConfig;
  let formMapping = [];
  const visitUuid = encounter.visit.uuid;

  if ([f08Form, f09Form].includes(encounter.form.uuid)) {
    // F08 Form Encounter Mapping
    const f8Mapping = f8(encounter);
    formMapping.push(...f8Mapping);

    // F09 Form Encounter Mapping

    const attributeMap = {
      Lg1LrNf9LQR: genderAttr,
      OVo3FxLURtH: ageInMonthsAttr,
      f3n6kIB9IbI: ageInYearsAttr, // TODO:we see this in metadata "Rv8WM2mTuS5",
      oc9zlhOoWmP: currentStatusAttr,
      DbyD9bbGIvE: legalStatusAttr,
      fiPFww1viBB: placeOfLivingAttr,
      FsL5BjQocuo: nationalityAttr,
      Pi1zytYdq6l: patientNoAttr,
    };
    const f09Mapping = mapAttribute(tei.attributes, attributeMap);
    formMapping.push(...f09Mapping);
  }

  if ([f23Form, f24Form].includes(encounter.form.uuid)) {
    // F23 Form Encounter Mapping
    const f23Mapping = f23(encounter);
    formMapping.push(...f23Mapping);

    // F24 Form Encounter Mapping
    const attributeMap = {
      Hww0CNYYt3E: genderAttr,
      // Z7vMFdnQxpE: dobAttr,
      // L97SmAK11DN: ageInYearsAttr,
      yE0dIWW0TXP: placeOfLivingAttr,
      fnH6H3biOkE: patientNoAttr,
    };
    const attributeMapping = mapAttribute(tei.attributes, attributeMap);

    const dob = tei?.attributes?.find(
      (attr) => attr.attribute === dobAttr
    )?.value;

    if (dob) {
      let ageInDays = calculateAge(dob) * 365;
      attributeMapping.push({
        dataElement: "Z7vMFdnQxpE",
        value: ageInDays,
      });
    }
    if (!dob) {
      const age = tei?.attributes?.find(
        (attr) => attr.attribute === ageInYearsAttr
      )?.value;

      const ageInMonths = age * 12;

      attributeMapping.push({
        dataElement: "L97SmAK11DN",
        value: ageInMonths,
      });
    }

    formMapping.push(...attributeMapping);
  }

  if ([f25Form, f26Form].includes(encounter.form.uuid)) {
    const attributeMap = {
      eDuqRYx3wLx: genderAttr,
      d7wOfzPBbQD: ageInYearsAttr,
      y9pK9sVcbU9: ageInMonthsAttr,
      // b7z6xIpzkim: "",
      CDuiRuOcfzj: currentStatusAttr,
      JMhFzB97fcS: legalStatusAttr,
      Nd43pz1Oo62: placeOfLivingAttr,
      kcSuQKfU5Zo: patientNoAttr,
    };
    const attributeMapping = mapAttribute(tei.attributes, attributeMap);

    const dob = tei?.attributes?.find(
      (attr) => attr.attribute === dobAttr
    )?.value;

    const f26Mapping = f26(encounter, optsMap, optionSetKey);
    attributeMapping.push(...f26Mapping);
    if (dob) {
      let ageInDays = calculateAge(dob) * 365;
      attributeMapping.push({
        dataElement: "b7z6xIpzkim",
        value: ageInDays,
      });
    }

    formMapping.push(...attributeMapping);
  }

  if ([f27Form, f28Form].includes(encounter.form.uuid)) {
    // F27 Form Encounter Mapping
    const f27Mapping = f27(encounter);
    formMapping.push(...f27Mapping);

    // F28 Form Encounter Mapping
    const attributeMap = {
      WP5vr8KB2lH: genderAttr,
      Y7qzoa4Qaiz: currentStatusAttr,
      XCUd9xOGXkn: legalStatusAttr,
      onKT21rxH6Z: placeOfLivingAttr,
      sCKCNreiqEA: nationalityAttr,
      ci9C72RjN8Z: patientNoAttr,
    };
    const attributeMapping = mapAttribute(tei.attributes, attributeMap);

    const f28Mapping = [
      {
        dataElement: "NWOnMq8h4w1",
        value: teiAge(tei, dhis2Map.attr),
      },
    ];
    formMapping.push(...attributeMapping, ...f28Mapping);
  }

  if ([f41Form, f42Form, f43Form].includes(encounter.form.uuid)) {
    // F41 Form Encounter Mapping
    const f41Mapping = f41(encounter);
    formMapping.push(...f41Mapping);

    // F42 Form Encounter Mapping
    const f42Mapping = f42(encounter);
    formMapping.push(...f42Mapping);

    // F43 Form Encounter Mapping
    const attributeMap = {
      eMXqL66pJSV: genderAttr,
      hT8pIot8b6Y: ageInMonthsAttr,
      BA7aQjiwlrL: ageInYearsAttr, // in metadata->"Rv8WM2mTuS5",
      KRNhyZHeGGM: currentStatusAttr,
      fUxvDvbPKlU: legalStatusAttr,
      xw5Vres1Ndt: placeOfLivingAttr,
      iGHeO9F8CKm: nationalityAttr,
    };
    const f43AttributeMapping = mapAttribute(tei.attributes, attributeMap);
    formMapping.push(
      ...f43AttributeMapping,
      ...f43(encounter, tei, dhis2Map.attr)
    );
  }

  if ([f64Form, f65Form].includes(encounter.form.uuid)) {
    // F64 Form Encounter Mapping
    const f64Mapping = f64(encounter);
    formMapping.push(...f64Mapping);

    // F65 Form Encounter Mapping - Custom mappings
    const f65Mapping = f65(encounter);
    formMapping.push(...f65Mapping);

    // F64/F65 Form - TEI Attributes (shared between admission and discharge)
    const birthdate = tei?.attributes?.find(
      (attr) => attr.attribute === dhis2Map.attr.birthdate
    )?.value;

    // Calculate patient age in months from birthdate
    let ageInMonths = null;
    if (birthdate) {
      const birth = new Date(birthdate);
      const now = new Date();
      const diffTime = Math.abs(now - birth);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      ageInMonths = Math.floor(diffDays / 30.44); // approximate months
    }

    // Base attribute mappings
    const attributeMap = {
      j855dPp9p18: dhis2Map.attr.patientNumber, // ICU - Patient number
      icmcR6av0Ob: dhis2Map.attr.sex, // ICU - Sex
      OI2H3dEQLdQ: dhis2Map.attr.placeOfLivingAttr, // ICU - Place of living
      QiVXQ2eAtpN: dhis2Map.attr.nationalityAttr, // ICU - Nationality
    };
    const f64AttributeMapping = mapAttribute(tei.attributes, attributeMap);

    // Conditional age mapping based on patient age
    if (ageInMonths !== null) {
      if (ageInMonths > 23) {
        // Age > 23 months: use age in years
        const ageInYears = tei?.attributes?.find(
          (attr) => attr.attribute === dhis2Map.attr.ageInYears
        )?.value;

        if (ageInYears) {
          f64AttributeMapping.push({
            dataElement: "PLj9LCQy6Wb",
            value: ageInYears,
          });
        }
      } else if (ageInMonths >= 1 && ageInMonths <= 23) {
        // Age >= 1 month and <= 23 months: use age in months
        const ageInMonthsValue = tei?.attributes?.find(
          (attr) => attr.attribute === f64AgeInMonthsAttr
        )?.value;
        if (ageInMonthsValue) {
          f64AttributeMapping.push({
            dataElement: "orwtudPV2yK",
            value: ageInMonthsValue,
          });
        }
      } else if (ageInMonths < 1) {
        // Age < 1 month: use age in days
        const ageInDaysValue = ageInDays(
          birthdate,
          encounter.encounterDatetime
        );
        f64AttributeMapping.push({
          dataElement: "JY56Vj7fYiu",
          value: ageInDaysValue,
        });
      }
    }

    formMapping.push(...f64AttributeMapping);
  }

  if ([f66Form, f67Form].includes(encounter.form.uuid)) {
    // F66 Form Encounter Mapping - Custom mappings
    const f66Mapping = f66(encounter);
    formMapping.push(...f66Mapping);

    // F67 Form - Patient attributes for snakebites
    const birthdate = tei?.attributes?.find(
      (attr) => attr.attribute === dhis2Map.attr.birthdate
    )?.value;

    // Calculate patient age in months from birthdate
    let ageInMonths = null;
    if (birthdate) {
      const birth = new Date(birthdate);
      const now = new Date();
      const diffTime = Math.abs(now - birth);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      ageInMonths = Math.floor(diffDays / 30.44); // approximate months
    }

    // Base attribute mappings
    const attributeMap = {
      ipRL5PApBZk: dhis2Map.attr.patientNumber, // Snakebites - Patient number
      ZlONTbktjvX: dhis2Map.attr.sex, // Snakebites - Sex
      XK6Wnp4aBvi: placeOfLivingAttr, // Snakebites - Place of living
    };
    const f66AttributeMapping = mapAttribute(tei.attributes, attributeMap);

    // Conditional age mapping based on patient age
    if (ageInMonths !== null) {
      if (ageInMonths > 23) {
        // Age > 23 months: use age in years
        const ageInYears = tei?.attributes?.find(
          (attr) => attr.attribute === dhis2Map.attr.ageInYears
        )?.value;
        if (ageInYears) {
          f66AttributeMapping.push({
            dataElement: "InDF3cCb32B",
            value: ageInYears,
          });
        }
      } else if (ageInMonths <= 23) {
        // Age <= 23 months: use age in months
        const ageInMonthsValue = tei?.attributes?.find(
          (attr) => attr.attribute === f64AgeInMonthsAttr
        )?.value;
        if (ageInMonthsValue) {
          f66AttributeMapping.push({
            dataElement: "U5BMuwXeRbl",
            value: ageInMonthsValue,
          });
        }
      }
    }

    formMapping.push(...f66AttributeMapping);
  }

  const dataValuesMapping = Object.keys(form.dataValueMap)
    .map((dataElement) => {
      const value = findDataValue(encounter, dataElement, {
        optsMap,
        optionSetKey,
        form,
      });

      return { dataElement, value };
    })
    .filter((d) => d.value);

  dataValuesMapping.push({
    dataElement: "rbFVBI2N6Ex",
    value: visitUuid,
  });

  //setting the visitUuid here as a data element
  const combinedMapping = [...dataValuesMapping, ...formMapping].filter(
    Boolean
  );

  return combinedMapping;
};

fn((state) => {
  const f08Form = formIdByName("F08-ITFC Admission", state.formMaps);
  const f09Form = formIdByName("F09-ITFC Discharge", state.formMaps);
  const f23Form = formIdByName("F23-Neonatal Admission", state.formMaps);
  const f24Form = formIdByName("F24-Neonatal Discharge", state.formMaps);
  const f25Form = formIdByName("F25-Pediatrics Admission", state.formMaps);
  const f26Form = formIdByName("F26-Pediatrics Discharge", state.formMaps);
  const f27Form = formIdByName("F27-Adult Admission", state.formMaps);
  const f28Form = formIdByName("F28-Adult Discharge", state.formMaps);
  const f41Form = formIdByName("F41-ER Triage", state.formMaps);
  const f42Form = formIdByName("F42-ER Consultation", state.formMaps);
  const f43Form = formIdByName("F43-ER Exit", state.formMaps);
  const f64Form = formIdByName("F64-ICU Admission", state.formMaps);
  const f65Form = formIdByName("F65-ICU Discharge", state.formMaps);
  const f66Form = formIdByName("F66-Snakebite Admission", state.formMaps);
  const f67Form = formIdByName(
    "F67-Snakebite Patient Registration",
    state.formMaps
  );

  const pairedEncounters = state.latestEncountersByVisit.reduce((acc, obj) => {
    const program = state.formMaps[obj.form.uuid].programId;
    const orgUnit = state.formMaps[obj.form.uuid].orgUnit;
    const programStage = state.formMaps[obj.form.uuid].programStage;
    const patientOuProgram = `${orgUnit}:${program}:${programStage}:${obj.patient.uuid}:${obj.visit.uuid}`;
    if (!acc[patientOuProgram]) {
      acc[patientOuProgram] = [];
    }
    acc[patientOuProgram].push(obj);
    return acc;
  }, {});

  state.eventsMapping = Object.entries(pairedEncounters).map(
    ([patientKey, patientEncounters]) => {
      const [orgUnit, program, programStage, patientUuid] =
        patientKey.split(":");

      const tei = state.TEIs[patientUuid];
      if (!tei) {
        console.log({ patientUuid });
      }

      const dataValues = patientEncounters
        .map((encounter) => {
          const form = state.formMaps[encounter.form.uuid];
          if (!form?.dataValueMap) {
            return null;
          }
          return buildDataValues(encounter, tei, {
            optsMap: state.optsMap,
            optionSetKey: state.optionSetKey,
            dhis2Map: state.dhis2Map,
            form,
            f08Form,
            f09Form,
            f23Form,
            f24Form,
            f25Form,
            f26Form,
            f27Form,
            f28Form,
            f41Form,
            f42Form,
            f43Form,
            f64Form,
            f65Form,
            f66Form,
            f67Form,
          });
        })
        .flat()
        .filter((d) => d.value);

      const latestEncounter = patientEncounters.sort(
        (a, b) => new Date(b.encounterDatetime) - new Date(a.encounterDatetime)
      )[0];

      const eventDate = latestEncounter?.encounterDatetime.replace("+0000", "");

      const patientNumber = tei?.attributes?.find(
        (a) => a.code === "patient_number"
      ).value;

      const visitUuid = latestEncounter.visit.uuid;
      const event = state.eventsByPatient[`${orgUnit}-${program}`]?.[
        patientNumber
      ]?.find((e) => e.visitUuid === visitUuid)?.event;
      if (event) {
        console.log("Event found:", event);
      }
      return {
        event,
        program,
        orgUnit,
        occurredAt: eventDate,
        programStage,
        dataValues,
        trackedEntity: tei.trackedEntity,
      };
    }
  );

  return state;
});
