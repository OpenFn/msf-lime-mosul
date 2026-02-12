// F64-specific age attributes
const f64AgeInYearsAttr = "Rv8WM2mTuS5"; //dhis2Map.attr.ageInYears
const f64AgeInMonthsAttr = "k26cdlS78i9";

const MILLISECONDS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
const calculateAge = (dob) =>
  Math.floor((new Date() - new Date(dob)) / MILLISECONDS_PER_YEAR);

const teiAge = (tei, attr) => {
  const { ageInYears, birthdate } = attr;
  let age = tei?.attributes?.find(
    (attr) => attr.attribute === ageInYears
  )?.value;

  if (!age) {
    const dob = tei?.attributes?.find(
      (attr) => attr.attribute === birthdate
    )?.value;
    age = calculateAge(dob);
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

const conceptAndValue = (encounter, conceptUuid, valueUuid) => {
  const answer = encounter.obs.find(
    (o) => o.concept.uuid === conceptUuid && o.value.uuid === valueUuid
  );
  return answer ? "TRUE" : "FALSE";
};
const conceptAndValueTrueOnly = (encounter, conceptUuid, valueUuid) => {
  const answer = encounter.obs.find(
    (o) => o.concept.uuid === conceptUuid && o.value.uuid === valueUuid
  );
  return answer ? "TRUE" : undefined;
};

const dataValueByConcept = (encounter, de, state) => {
  const { dataElement, conceptUuid, questionId } = de;

  const answer = encounter.obs.find((o) => o.concept.uuid === conceptUuid);
  const isObjectAnswer = answer && typeof answer.value === "object";
  const isStringAnswer = answer && typeof answer.value === "string";
  const isNumberAnswer = answer && typeof answer.value === "number";

  if (isStringAnswer || isNumberAnswer) {
    return answer.value;
  }

  if (isObjectAnswer) {
    const optionKey = questionId
      ? `${encounter.form.uuid}-${answer.concept.uuid}-${questionId}`
      : `${encounter.form.uuid}-${answer.concept.uuid}`;

    const matchingOptionSet = state.optionSetKey[optionKey];

    const opt = state.optsMap.find(
      (o) =>
        o["value.uuid - External ID"] === answer.value.uuid &&
        o["DHIS2 Option Set UID"] === matchingOptionSet
    );

    if (!opt && matchingOptionSet) {
      console.log(
        `No opt found for External id ${answer.value.uuid} and DHIS2 OptionSet ${matchingOptionSet}`
      );
    }

    const matchingOption = opt?.["DHIS2 Option Code"];

    if (!matchingOption) {
      const optSet = {
        timestamp: new Date().toISOString(),
        openMrsQuestion: answer.concept.display || "N/A",
        conceptExternalId: answer.concept.uuid,
        answerDisplay: answer.value.display,
        answerValueUuid: answer.value.uuid,
        dhis2DataElementUid: dataElement,
        dhis2OptionSetUid: matchingOptionSet || "N/A",
        metadataFormName: encounter.form.name || encounter.form.uuid,
        encounterUuid: encounter.uuid,
        patientUuid: encounter.patient.uuid,
        sourceFile: state.sourceFile,
        optionKey,
      };
      // Capture missing DHIS2 Option Codes for tracking
      state.missingOptsets.push(optSet);
    }

    if (["FALSE", "No"].includes(matchingOption)) return "false";
    if (["TRUE", "Yes"].includes(matchingOption)) return "true";

    return matchingOption;
  }
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

function f26(encounter, state) {
  const config = {
    concept: "8afa4dfc-b2af-452c-b402-4b96b0f334b4",
    qid: "rfe-forms-antimalariaType",
    dataElements: ["GUiSgvbwUyc", "F6C5WnGoj5r"],
  };
  const antimalariaType = filterObsByConcept(
    encounter,
    `${config.concept}-${config.qid}`
  );

  return antimalariaType.slice(0, 2).map((obs, index) => {
    const de = dataElements[index];

    const value = dataValueByConcept(
      { ...encounter, obs: [obs] }, // Pass single obs
      {
        dataElement: de,
        conceptUuid: config.concept,
        questionId: config.qid,
      },
      state
    );
    return {
      dataElement: de,
      value: value,
    };
  });
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

function f43(encounter, tei, dhis2Attr) {
  const mappings = [];
  const obsDatetime = findObsByConcept(
    encounter,
    "88472a4e-f26e-4235-8144-4ad6df874949"
  )?.value;

  const birthdate = tei?.attributes?.find(
    (attr) => attr.attribute === dhis2Attr.birthdate
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

function f61(encounter, events, state) {
  const event = events?.find((e) => e.programStage === "y8MvLYtuKE3")?.event;

  return [
    {
      event,
      programStage: "y8MvLYtuKE3",
      dataValues: [
        {
          dataElement: "wqSAGFM1Oz8",
          value: encounter.obs.some(
            (o) => o.concept.uuid === "2ff0d1ad-df05-4128-b2d2-d72307a6aa3f"
          )
            ? "TRUE"
            : "FALSE",
        },
        {
          dataElement: "M7aqCkQSnIP",
          value: conceptAndValueTrueOnly(
            encounter,
            "2ff0d1ad-df05-4128-b2d2-d72307a6aa3f",
            "95ac8931-7222-4d14-9d94-2e55074e6261"
          ),
        },
        {
          dataElement: "H6mrPZ2PvGa",
          value: conceptAndValueTrueOnly(
            encounter,
            "2ff0d1ad-df05-4128-b2d2-d72307a6aa3f",
            "a257d08e-b90d-4505-91c3-e23ea040f61c"
          ),
        },
        {
          dataElement: "aHEgOilU4Sg",
          value: conceptAndValueTrueOnly(
            encounter,
            "2ff0d1ad-df05-4128-b2d2-d72307a6aa3f",
            "02e8a7bc-d18c-4650-bf47-c8e52f493f3b"
          ),
        },
        {
          dataElement: "I64ENhlDzP6",
          value: conceptAndValueTrueOnly(
            encounter,
            "2ff0d1ad-df05-4128-b2d2-d72307a6aa3f",
            "a6fe73a2-0352-4104-82a7-4456f1866c1e"
          ),
        },
        {
          dataElement: "i69GqSWXwRZ",
          value: conceptAndValueTrueOnly(
            encounter,
            "2ff0d1ad-df05-4128-b2d2-d72307a6aa3f",
            "9f50dc11-9ed4-4e25-a059-9cb770651c35"
          ),
        },
        // Difficulties faced - TRUE_ONLY fields
        // NOTE: Value UUIDs should be verified against actual OMRS data
        {
          dataElement: "KGwTrsJjYR5", // Violence
          value: conceptAndValueTrueOnly(
            encounter,
            "ebb50467-1a62-41f0-a849-2ec0ed49607a",
            "ebb50467-1a62-41f0-a849-2ec0ed49607a"
          ),
        },
        {
          dataElement: "G10cJ5RJ2uE", // Hunger
          value: conceptAndValueTrueOnly(
            encounter,
            "ebb50467-1a62-41f0-a849-2ec0ed49607a",
            "04684645-508f-4ec4-91a9-406e5567a934"
          ),
        },
        {
          dataElement: "Yp6qfnhSbTx", // Authorities
          value: conceptAndValueTrueOnly(
            encounter,
            "ebb50467-1a62-41f0-a849-2ec0ed49607a",
            "e81a13a6-d469-465d-9c6b-9930c7bb7d39"
          ),
        },
        {
          dataElement: "LgoaYXv2mkO", // Environment conditions
          value: conceptAndValueTrueOnly(
            encounter,
            "ebb50467-1a62-41f0-a849-2ec0ed49607a",
            "05aa3b94-7e7e-47f1-80b9-1304889c293c"
          ),
        },
        {
          dataElement: "ScHhUDsY1JM", // Restricted movements
          value: conceptAndValueTrueOnly(
            encounter,
            "ebb50467-1a62-41f0-a849-2ec0ed49607a",
            "b10b22e3-a46d-4682-aba5-fdeac3591d29"
          ),
        },
        {
          dataElement: "vKTI1wQhhy7", // Sickness or death
          value: conceptAndValueTrueOnly(
            encounter,
            "ebb50467-1a62-41f0-a849-2ec0ed49607a",
            "67322e0a-0def-4543-97cd-89cdd03e2950"
          ),
        },
        {
          dataElement: "wiOCvUUHUEr",
          value: dataValueByConcept(
            encounter,
            {
              dataElement: "wiOCvUUHUEr",
              conceptUuid: "d0e31c9b-fb6b-4d8b-9c54-c8410c719f1c",
              questionId: "rfe-forms-howDoYouPlanToTravel",
            },
            state
          ),
        },
        // Continuity of care needed - TRUE_ONLY fields
        {
          dataElement: "gJoiya16c1E", // NCD
          value: conceptAndValueTrueOnly(
            encounter,
            "d30db8b8-f8fb-450c-9562-629195212a45",
            "a6fe73a2-0352-4104-82a7-4456f1866c1e"
          ),
        },
        {
          dataElement: "aHEgOilU4Sg", // SRH
          value: conceptAndValueTrueOnly(
            encounter,
            "d30db8b8-f8fb-450c-9562-629195212a45",
            "02e8a7bc-d18c-4650-bf47-c8e52f493f3b"
          ),
        },
        {
          dataElement: "ahGVTDSbSaq", // MH
          value: conceptAndValueTrueOnly(
            encounter,
            "d30db8b8-f8fb-450c-9562-629195212a45",
            "a257d08e-b90d-4505-91c3-e23ea040f61c"
          ),
        },
        {
          dataElement: "i69GqSWXwRZ", // Other
          value: conceptAndValueTrueOnly(
            encounter,
            "d30db8b8-f8fb-450c-9562-629195212a45",
            "9f50dc11-9ed4-4e25-a059-9cb770651c35"
          ),
        },
        // Care packages given - TRUE_ONLY fields
        {
          dataElement: "Sp0VsyyvDCI", // First aid kit
          value: conceptAndValueTrueOnly(
            encounter,
            "96d32363-694a-4d6a-9710-6ceadd0e2894",
            "4a946686-7d67-40d5-b1f1-a0aad133193c"
          ),
        },
        {
          dataElement: "JNNfaYcPPuS", // Hygiene kit
          value: conceptAndValueTrueOnly(
            encounter,
            "96d32363-694a-4d6a-9710-6ceadd0e2894",
            "9de0f8c5-df5c-4fc2-a586-48acd7219e04"
          ),
        },
        {
          dataElement: "awIYcHfNEnI", // Baby kit
          value: conceptAndValueTrueOnly(
            encounter,
            "96d32363-694a-4d6a-9710-6ceadd0e2894",
            "0254978b-c858-4b9d-ba66-074ced37a6d5"
          ),
        },
        {
          dataElement: "xjG5N6RD9vm", // Mental Health kit
          value: conceptAndValueTrueOnly(
            encounter,
            "96d32363-694a-4d6a-9710-6ceadd0e2894",
            "e48a7343-bbc1-4e83-85ab-87e267f15cec"
          ),
        },
        {
          dataElement: "Lj15WiOE5Jj", // Drugs provided - BOOLEAN
          value: conceptAndValue(
            encounter,
            "96d32363-694a-4d6a-9710-6ceadd0e2894",
            "2b616aa9-e573-40a1-8e01-dfdde229553b"
          ),
        },
      ].filter((d) => d.value),
    },
  ];
}

function f64(encounter) {
  const mappings = [];

  // Admission date and time (Question #1)
  // Concept: 7f00c65d-de60-467a-8964-fe80c7a85ef0
  const admissionTime = findObsByConcept(
    encounter,
    "7f00c65d-de60-467a-8964-fe80c7a85ef0"
  )?.value;

  if (admissionTime) {
    const timePart = admissionTime.substring(11, 16);
    mappings.push({
      dataElement: "KDZguOxdsZk", // ICU - Admission time
      value: timePart,
    });
  }

  // Patient transferred from (Question #2)
  // Concept: b3a5baf0-31bb-43cc-9a74-e9ea6b29d713
  const patientTransferredFrom = findObsByConcept(
    encounter,
    "b3a5baf0-31bb-43cc-9a74-e9ea6b29d713"
  )?.value;

  if (patientTransferredFrom) {
    mappings.push({
      dataElement: "aBFddBaxqmt", // ICU - Patient transferred from
      value: patientTransferredFrom.display,
    });

    // If other, specify (Question #3) - Only relevant if "Other" was selected
    // Concept: 790b41ce-e1e7-11e8-b02f-0242ac130002
    if (
      patientTransferredFrom.display &&
      (patientTransferredFrom.display.toLowerCase().includes("other") ||
        patientTransferredFrom.display.toLowerCase().includes("autre"))
    ) {
      const otherSpecify = findObsByConcept(
        encounter,
        "790b41ce-e1e7-11e8-b02f-0242ac130002"
      )?.value;

      if (otherSpecify) {
        mappings.push({
          dataElement: "bSjWec25a2M", // ICU - if other, specify
          value: otherSpecify,
        });
      }
    }
  }

  // Re-admission (Question #4)
  // Concept: e4e42ecd-196b-4aa8-a265-bfbed09d77cf
  const reAdmission = findObsByConcept(
    encounter,
    "e4e42ecd-196b-4aa8-a265-bfbed09d77cf"
  )?.value;

  if (reAdmission !== undefined) {
    mappings.push({
      dataElement: "k9oIzraTTCY", // ICU - Re-admission
      value:
        reAdmission.display === "Yes" ||
        reAdmission.display === "TRUE" ||
        reAdmission === true,
    });
  }

  // In-admission criteria (Question #5)
  // Concept: a1546b77-181d-4cea-b21d-33ab07b328e1
  const admissionCriteria = findObsByConcept(
    encounter,
    "a1546b77-181d-4cea-b21d-33ab07b328e1"
  )?.value;

  if (admissionCriteria !== undefined) {
    mappings.push({
      dataElement: "fYaH1aRPWKd", // ICU - In-admission criteria
      value:
        admissionCriteria.display === "Yes" ||
        admissionCriteria.display === "TRUE" ||
        admissionCriteria === true,
    });
  }

  // Reason for admission (Question #6)
  // Concept: 65a0f171-8c4f-4f69-acee-79e73b896a0f
  const reasonForAdmission = findObsByConcept(
    encounter,
    "65a0f171-8c4f-4f69-acee-79e73b896a0f"
  )?.value;

  if (reasonForAdmission) {
    mappings.push({
      dataElement: "caDcY34IBaM", // ICU - Reason for admission 2
      value: reasonForAdmission.display,
    });
  }

  // Hospitalisation cause (Question #18)
  // Concept: 808a581e-cf83-45eb-b46b-de5ebb8d5dfe
  const hospitalisationCause = findObsByConcept(
    encounter,
    "808a581e-cf83-45eb-b46b-de5ebb8d5dfe"
  )?.value;

  if (hospitalisationCause) {
    mappings.push({
      dataElement: "cvrP0fldn57", // ICU - Hospitalisation cause
      value: hospitalisationCause.display,
    });
  }

  // Weight at admission (Question #41)
  // Concept: 9e3c4083-21bd-42d4-a2b5-657bc0b8a4a5
  const weightAtAdmission = findObsByConcept(
    encounter,
    "9e3c4083-21bd-42d4-a2b5-657bc0b8a4a5"
  )?.value;

  if (weightAtAdmission !== undefined) {
    mappings.push({
      dataElement: "PIgCQWLxywu", // ICU - Weight at admission (in Kg)
      value: weightAtAdmission,
    });
  }

  // Comments (Question #45)
  // Concept: db316f14-259b-40ab-89c5-7d3187967f82
  const comments = findObsByConcept(
    encounter,
    "db316f14-259b-40ab-89c5-7d3187967f82"
  )?.value;

  if (comments) {
    mappings.push({
      dataElement: "NHA7cwXqQWE", // ICU - Comments
      value: comments,
    });
  }

  return mappings;
}

function f65(encounter) {
  const mappings = [];

  // Discharge date and time (Question #1)
  // Concept: d92dd800-b048-4724-86fa-91d006f9caa8
  const dischargeDateTime = findObsByConcept(
    encounter,
    "d92dd800-b048-4724-86fa-91d006f9caa8"
  )?.value;

  if (dischargeDateTime) {
    const datePart = dischargeDateTime.substring(0, 10);
    const timePart = dischargeDateTime.substring(11, 16);
    mappings.push(
      {
        dataElement: "GwlaaueZOz1", // ICU - Discharge date
        value: datePart,
      },
      {
        dataElement: "Me7I97tO6lt", // ICU - Discharge time (HH:MM)
        value: timePart,
      }
    );
  }

  // Complications (Question #3)
  // Concept: ec9ffc6e-22c9-4489-ab88-c517460e7838
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

  // Helper: Get all "Comments" observations to handle multiple comment fields
  // Concept: db316f14-259b-40ab-89c5-7d3187967f82
  const commentObs = filterObsByConcept(
    encounter,
    "db316f14-259b-40ab-89c5-7d3187967f82"
  );

  // Notes on complications (Question #4) - if any complications selected
  if (commentObs.length > 0) {
    const notesOnComplications = commentObs[0]?.value;
    if (notesOnComplications) {
      mappings.push({
        dataElement: "D5ECjU5w0S8", // ICU - if Other complications specify
        value: notesOnComplications,
      });
      commentObs.shift(); // Remove the used observation
    }
  }

  // Procedures (Question #7)
  // Concept: d3ffa682-10ab-41f3-8965-d5835028ddf1
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

  // If oxygen therapy, how many hours? (Question #8)
  // Concept: dfd75194-5e4c-4cfd-9fa3-2bbb9a8ac9f8
  const oxygenTherapyHours = findObsByConcept(
    encounter,
    "dfd75194-5e4c-4cfd-9fa3-2bbb9a8ac9f8"
  )?.value;

  if (oxygenTherapyHours !== undefined) {
    mappings.push({
      dataElement: "xTeMtjKirxp", // ICU - If oxygen therapy, how many hours?
      value: oxygenTherapyHours,
    });
  }

  // If ventilation, how many hours? (Question #9)
  // Concept: 9cd8fdd5-fdbd-4e85-baf0-4d8c162e1711
  const ventilationHours = findObsByConcept(
    encounter,
    "9cd8fdd5-fdbd-4e85-baf0-4d8c162e1711"
  )?.value;

  if (ventilationHours !== undefined) {
    mappings.push({
      dataElement: "AyJOgCdsjCB", // ICU - if ventilation, how many hours?
      value: ventilationHours,
    });
  }

  // If sedation, how many hours? (Question #10)
  // Concept: 6d36b085-2844-441a-9e62-2cbce2b89436
  const sedationHours = findObsByConcept(
    encounter,
    "6d36b085-2844-441a-9e62-2cbce2b89436"
  )?.value;

  if (sedationHours !== undefined) {
    mappings.push({
      dataElement: "Xyq5RpkLBrP", // ICU - Sedation (how many hours)
      value: sedationHours,
    });
  }

  // Weight at discharge (Question #14)
  // Concept: cdb8c5f1-1afd-41d0-ba30-714440441555
  const weightAtDischarge = findObsByConcept(
    encounter,
    "cdb8c5f1-1afd-41d0-ba30-714440441555"
  )?.value;

  if (weightAtDischarge !== undefined) {
    mappings.push({
      dataElement: "dbfPrOrNd0Z", // ICU - Weight at discharge (in Kg)
      value: weightAtDischarge,
    });
  }

  // Helper: Get all "Other, specify" observations
  // Concept: 790b41ce-e1e7-11e8-b02f-0242ac130002
  const otherSpecifyObs = filterObsByConcept(
    encounter,
    "790b41ce-e1e7-11e8-b02f-0242ac130002"
  );

  // Final main diagnosis (Question #23)
  // Concept: 9da302ed-948f-4030-8f0a-a294dd3dff21
  const finalMainDiagnosis = findObsByConcept(
    encounter,
    "9da302ed-948f-4030-8f0a-a294dd3dff21"
  )?.value;

  if (finalMainDiagnosis) {
    mappings.push({
      dataElement: "VF9mO17BUGq", // ICU - Final main diagnosis (non surgical conditions)
      value: finalMainDiagnosis.display,
    });

    // Final main diagnosis - if 'other', specify (Question #24)
    if (
      finalMainDiagnosis.display &&
      (finalMainDiagnosis.display.toLowerCase().includes("other") ||
        finalMainDiagnosis.display.toLowerCase().includes("autre"))
    ) {
      const otherValue = otherSpecifyObs[0]?.value;
      if (otherValue) {
        mappings.push({
          dataElement: "lN6UabysLNl", // ICU - Final main diagnosis - if 'other', specify
          value: otherValue,
        });
        otherSpecifyObs.shift(); // Remove the used observation
      }
    }
  }

  // Final secondary diagnosis 1 (Question #25)
  // Concept: 3a03bdb4-4b3f-45c3-966a-97843ec88680
  const finalSecondaryDiagnosis1 = findObsByConcept(
    encounter,
    "3a03bdb4-4b3f-45c3-966a-97843ec88680"
  )?.value;

  if (finalSecondaryDiagnosis1) {
    mappings.push({
      dataElement: "ye41OtFZ21M", // ICU - Final secondary diagnosis 1
      value: finalSecondaryDiagnosis1.display,
    });

    // Final 2nd diagnosis 1 - if 'other', specify (Question #26)
    if (
      finalSecondaryDiagnosis1.display &&
      (finalSecondaryDiagnosis1.display.toLowerCase().includes("other") ||
        finalSecondaryDiagnosis1.display.toLowerCase().includes("autre"))
    ) {
      const otherValue = otherSpecifyObs[0]?.value;
      if (otherValue) {
        mappings.push({
          dataElement: "RA2msXsMUjE", // ICU - Final 2nd diagnosis 1 - if 'other', specify
          value: otherValue,
        });
        otherSpecifyObs.shift(); // Remove the used observation
      }
    }
  }

  // Final secondary diagnosis 2 (Question #27)
  // Concept: e9ff5084-8d17-48e8-a1b7-890d1b4e14b1
  const finalSecondaryDiagnosis2 = findObsByConcept(
    encounter,
    "e9ff5084-8d17-48e8-a1b7-890d1b4e14b1"
  )?.value;

  if (finalSecondaryDiagnosis2) {
    mappings.push({
      dataElement: "SXYe6Df4fy1", // ICU - Final secondary diagnosis 2
      value: finalSecondaryDiagnosis2.display,
    });

    // Final 2nd diagnosis 2 - if 'other', specify (Question #28)
    if (
      finalSecondaryDiagnosis2.display &&
      (finalSecondaryDiagnosis2.display.toLowerCase().includes("other") ||
        finalSecondaryDiagnosis2.display.toLowerCase().includes("autre"))
    ) {
      const otherValue = otherSpecifyObs[0]?.value;
      if (otherValue) {
        mappings.push({
          dataElement: "RGsyqjcPLy4", // ICU - Final 2nd diagnosis 2 - if 'other', specify
          value: otherValue,
        });
        otherSpecifyObs.shift(); // Remove the used observation
      }
    }
  }

  // Final secondary diagnosis 3 (Question #29)
  // Concept: d1e43f55-4432-4a19-bf17-5a1c97b2226f
  const finalSecondaryDiagnosis3 = findObsByConcept(
    encounter,
    "d1e43f55-4432-4a19-bf17-5a1c97b2226f"
  )?.value;

  if (finalSecondaryDiagnosis3) {
    mappings.push({
      dataElement: "ah8p7pDGvSn", // ICU - Final secondary diagnosis 3
      value: finalSecondaryDiagnosis3.display,
    });

    // Final 2nd diagnosis 3 - if 'other', specify (Question #30)
    if (
      finalSecondaryDiagnosis3.display &&
      (finalSecondaryDiagnosis3.display.toLowerCase().includes("other") ||
        finalSecondaryDiagnosis3.display.toLowerCase().includes("autre"))
    ) {
      const otherValue = otherSpecifyObs[0]?.value;
      if (otherValue) {
        mappings.push({
          dataElement: "Pp4sZGw19NB", // ICU - Final 2nd diagnosis 3 - if 'other', specify
          value: otherValue,
        });
        otherSpecifyObs.shift(); // Remove the used observation
      }
    }
  }

  // Type of discharge (Question #31)
  // Concept: 09a06404-afc5-457a-91b9-54152e45a854
  const typeOfDischarge = findObsByConcept(
    encounter,
    "09a06404-afc5-457a-91b9-54152e45a854"
  )?.value;

  if (typeOfDischarge) {
    mappings.push({
      dataElement: "X5USNxYfnw8", // ICU - Type of discharge
      value: typeOfDischarge.display,
    });

    // If other type of discharge, specify (Question #32)
    if (
      typeOfDischarge.display &&
      (typeOfDischarge.display.toLowerCase().includes("other") ||
        typeOfDischarge.display.toLowerCase().includes("autre"))
    ) {
      const otherValue = otherSpecifyObs[0]?.value;
      if (otherValue) {
        mappings.push({
          dataElement: "Gq8L0KVLS1m", // ICU - If type of discharge other, specify
          value: otherValue,
        });
        otherSpecifyObs.shift(); // Remove the used observation
      }
    }
  }

  // If referred, to where (Question #33)
  // Concept: 93eb9716-6866-4d13-9b8f-59c0a7605a11
  const referredToWhere = findObsByConcept(
    encounter,
    "93eb9716-6866-4d13-9b8f-59c0a7605a11"
  )?.value;

  if (referredToWhere) {
    mappings.push({
      dataElement: "Dh6a82Fu7Zv", // ICU - If referred, to where
      value: referredToWhere.display,
    });

    // If referred, to where - if other, specify (Question #34)
    if (
      referredToWhere.display &&
      (referredToWhere.display.toLowerCase().includes("other") ||
        referredToWhere.display.toLowerCase().includes("autre"))
    ) {
      const otherValue = otherSpecifyObs[0]?.value;
      if (otherValue) {
        mappings.push({
          dataElement: "xHtopHW9tN5", // ICU - If referred, to where - if other, specify
          value: otherValue,
        });
        otherSpecifyObs.shift(); // Remove the used observation
      }
    }
  }

  // Cause of referral (Question #35)
  // Concept: 53b450aa-d27c-4c2f-9a4e-98513bbe645f
  const causeOfReferral = findObsByConcept(
    encounter,
    "53b450aa-d27c-4c2f-9a4e-98513bbe645f"
  )?.value;

  if (causeOfReferral) {
    mappings.push({
      dataElement: "GZwo0YTh18F", // ICU - Cause of referral
      value: causeOfReferral,
    });
  }

  // If transfer, to where (Question #36)
  // Concept: eef5efc1-4d6a-43fb-87e1-4cca9842678d
  const transferToWhere = findObsByConcept(
    encounter,
    "eef5efc1-4d6a-43fb-87e1-4cca9842678d"
  )?.value;

  if (transferToWhere) {
    mappings.push({
      dataElement: "NgnZrz8aeKN", // ICU - If transfer, to where
      value: transferToWhere.display,
    });

    // If transfer, to where - if other, specify (Question #37)
    if (
      transferToWhere.display &&
      (transferToWhere.display.toLowerCase().includes("other") ||
        transferToWhere.display.toLowerCase().includes("autre"))
    ) {
      const otherValue = otherSpecifyObs[0]?.value;
      if (otherValue) {
        mappings.push({
          dataElement: "NjDrYZ1BYSs", // ICU - If transfer, to where - if other, specify
          value: otherValue,
        });
        otherSpecifyObs.shift(); // Remove the used observation
      }
    }
  }

  // Death cause (Question #38)
  // Concept: 778b70b5-c6de-4459-a101-6bf02f77d5c7
  const deathCause = findObsByConcept(
    encounter,
    "778b70b5-c6de-4459-a101-6bf02f77d5c7"
  )?.value;

  if (deathCause) {
    mappings.push({
      dataElement: "eKtwjKyRgTN", // ICU - Death cause
      value: deathCause.display,
    });
  }

  // Specify death cause (Question #39)
  // Concept: e364431c-0eee-4acc-a1e6-d9c4484903f2
  const specifyDeathCause = findObsByConcept(
    encounter,
    "e364431c-0eee-4acc-a1e6-d9c4484903f2"
  )?.value;

  if (specifyDeathCause) {
    mappings.push({
      dataElement: "dSEw5AdEZIf", // ICU - Specify death cause
      value: specifyDeathCause,
    });
  }

  // Death within 48h? (Question #40)
  // Concept: ab9fcaa9-0d65-4755-be0d-092d1cdaadb8
  const deathWithin48h = findObsByConcept(
    encounter,
    "ab9fcaa9-0d65-4755-be0d-092d1cdaadb8"
  )?.value;

  if (deathWithin48h !== undefined) {
    mappings.push({
      dataElement: "NcMO7ye3tbx", // ICU - Death within 48h?
      value:
        deathWithin48h.display === "Yes" ||
        deathWithin48h.display === "TRUE" ||
        deathWithin48h === true,
    });
  }

  // Comments (Question #41) - General comments field
  // Use remaining comment observation if available
  if (commentObs.length > 0) {
    const comments = commentObs[0]?.value;
    if (comments) {
      mappings.push({
        dataElement: "NHA7cwXqQWE", // ICU - Comments
        value: comments,
      });
    }
  }

  return mappings;
}

function f66(encounter) {
  const mappings = [];

  // Risk factors concept
  const RISK_FACTORS_CONCEPT = "b5598ad3-b010-4b78-a47f-944062c8d46c";
  const riskFactors = [
    {
      dataElement: "q3Ofs4sb4sB", // Snakebites - Diabetes
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

  // Signs and symptoms evolution (6h exit)
  // Uses the same concept as admission signs/symptoms: 5f683542-233e-47c2-b06e-69d2a639a78b
  // These map to different data elements to track symptom evolution from admission to 6h exit

  // Cytotoxic evolution - mirrors admission cytotoxic signs
  if (dryBite) {
    mappings.push({
      dataElement: "uZOKOcCGHqE", // Snakebites - 6h - exit: Cytotoxic
      value: "oARwiGgobcd", // Dry bite
    });
  } else if (mildCytotoxic) {
    mappings.push({
      dataElement: "uZOKOcCGHqE",
      value: "h1twBaWpKPF", // Mild cytotoxic
    });
  } else if (severeCytotoxic) {
    mappings.push({
      dataElement: "uZOKOcCGHqE",
      value: "Tz3eOWkiFPW", // Severe cytotoxic
    });
  }

  // Hematotoxic evolution - mirrors admission hematotoxic signs
  if (bleeding && !notClotting) {
    mappings.push({
      dataElement: "kFjWm5ZYkS2", // Snakebites - 6h - exit: Hematotoxic
      value: "TL1JkvBhwZj", // Bleeding
    });
  } else if (!bleeding && notClotting) {
    mappings.push({
      dataElement: "kFjWm5ZYkS2",
      value: "C9YeFTRG7hR", // Not clotting
    });
  } else if (bleeding && notClotting) {
    mappings.push({
      dataElement: "kFjWm5ZYkS2",
      value: "C08j0szZSKz", // Both
    });
  } else if (!bleeding && clotting) {
    mappings.push({
      dataElement: "kFjWm5ZYkS2",
      value: "aNsED3NFbns", // No
    });
  }

  // Other evolution symptoms - mirrors admission symptoms
  const evolutionSymptoms = [
    {
      dataElement: "RE55naGtgeR", // Ptosis
      valueId: "127652AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "A2FtERcITXf", // Diplopia
      valueId: "118872AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "E9t4MkYI7y6", // Respiratory paralysis
      valueId: "206AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "CY6nPuLtUuc", // Hypotension
      valueId: "2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "kAKH96OxZnd", // Shock
      valueId: "120AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "G3RL6izz9sF", // Arrhythmia
      valueId: "120148AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "gU9j2VsDgHR", // Vomiting
      valueId: "122983AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "A0tGqfX9mND", // Diarrhoea
      valueId: "142412AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "yB1GPiDglMU", // Tachycardia
      valueId: "141830AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "YbHZEW4crvo", // Fever
      valueId: "140238AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "sKIL8nyk2N9", // Hypoperfusion
      valueId: "127639AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "WPAIWO2vewI", // Hypoxia
      valueId: "141497AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    {
      dataElement: "SYJSMoZluue", // Altered consciousness
      valueId: "120345AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
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

const findDataValue = (encounter, dataElement, state) => {
  if (dataElement === "H9noxo3e7ox") {
    return;
  }
  const form = state.formMaps[encounter.form.uuid];
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

    const matchingOptionSet = state.optionSetKey[optionKey];

    const opt = state.optsMap.find(
      (o) =>
        o["value.uuid - External ID"] === answer.value.uuid &&
        o["DHIS2 Option Set UID"] === matchingOptionSet
    );

    // Removed fallback logic to DHIS2 Option name and answer.value.display
    // Now only using DHIS2 Option Code to ensure proper validation
    const matchingOption = opt?.["DHIS2 Option Code"];

    // Capture missing DHIS2 Option Codes for tracking
    if (!matchingOption) {
      state.missingOptsets.push({
        timestamp: new Date().toISOString(),
        openMrsQuestion: answer.concept.display || "N/A",
        conceptExternalId: answer.concept.uuid,
        answerDisplay: answer.value.display,
        answerValueUuid: answer.value.uuid,
        dhis2DataElementUid: dataElement,
        dhis2OptionSetUid: matchingOptionSet || "N/A",
        metadataFormName: encounter.form.name || encounter.form.uuid,
        encounterUuid: encounter.uuid,
        patientUuid: encounter.patient.uuid,
        sourceFile: state.sourceFile,
        optionKey,
      });
    }

    if (["FALSE", "No"].includes(matchingOption)) return "false";
    if (["TRUE", "Yes"].includes(matchingOption)) return "true";

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
    f61Form,
    f64Form,
    f65Form,
    f66Form,
  } = mappingConfig;
  let formMapping = [];
  const visitUuid = encounter.visit.uuid;

  if ([f08Form, f09Form].includes(encounter.form.uuid)) {
    // F08 Form Encounter Mapping
    const f8Mapping = f8(encounter);
    formMapping.push(...f8Mapping);

    // F09 Form Encounter Mapping
    const attributeMap = {
      Lg1LrNf9LQR: dhis2Map.attr.sex,
      OVo3FxLURtH: dhis2Map.attr.ageInMonth,
      f3n6kIB9IbI: dhis2Map.attr.ageInYears, // TODO:we see this in metadata "Rv8WM2mTuS5",
      oc9zlhOoWmP: dhis2Map.attr.currentStatus,
      DbyD9bbGIvE: dhis2Map.attr.legalStatus,
      fiPFww1viBB: dhis2Map.attr.placeOfLivingAttr,
      FsL5BjQocuo: dhis2Map.attr.nationalityAttr,
      Pi1zytYdq6l: dhis2Map.attr.patientNumber,
    };
    const f09Mapping = mapAttribute(tei.attributes, attributeMap);
    formMapping.push(...f09Mapping);
  }
  if (f61Form === encounter.form.uuid) {
    const f61Mapping = f61(encounter, tei.events, state);
    formMapping.push(...f61Mapping);
  }
  if ([f23Form, f24Form].includes(encounter.form.uuid)) {
    // F23 Form Encounter Mapping
    const f23Mapping = f23(encounter);
    formMapping.push(...f23Mapping);

    // F24 Form Encounter Mapping
    const attributeMap = {
      Hww0CNYYt3E: dhis2Map.attr.sex,
      // Z7vMFdnQxpE: dhis2Map.attr.birthdate,
      // L97SmAK11DN: dhis2Map.attr.ageInYears,
      yE0dIWW0TXP: dhis2Map.attr.placeOfLivingAttr,
      fnH6H3biOkE: dhis2Map.attr.patientNumber,
    };
    const attributeMapping = mapAttribute(tei.attributes, attributeMap);

    const dob = tei?.attributes?.find(
      (attr) => attr.attribute === dhis2Map.attr.birthdate
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
        (attr) => attr.attribute === dhis2Map.attr.ageInYears
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
      eDuqRYx3wLx: dhis2Map.attr.sex,
      d7wOfzPBbQD: dhis2Map.attr.ageInYears,
      y9pK9sVcbU9: dhis2Map.attr.ageInMonth,
      // b7z6xIpzkim: "",
      CDuiRuOcfzj: dhis2Map.attr.currentStatus,
      JMhFzB97fcS: dhis2Map.attr.legalStatus,
      Nd43pz1Oo62: dhis2Map.attr.placeOfLivingAttr,
      kcSuQKfU5Zo: dhis2Map.attr.patientNumber,
    };
    const attributeMapping = mapAttribute(tei.attributes, attributeMap);

    const dob = tei?.attributes?.find(
      (attr) => attr.attribute === dhis2Map.attr.birthdate
    )?.value;

    const f26Mapping = f26(encounter, state);
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
      WP5vr8KB2lH: dhis2Map.attr.sex,
      Y7qzoa4Qaiz: dhis2Map.attr.currentStatus,
      XCUd9xOGXkn: dhis2Map.attr.legalStatus,
      onKT21rxH6Z: dhis2Map.attr.placeOfLivingAttr,
      sCKCNreiqEA: dhis2Map.attr.nationalityAttr,
      ci9C72RjN8Z: dhis2Map.attr.patientNumber,
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
      eMXqL66pJSV: dhis2Map.attr.sex,
      hT8pIot8b6Y: dhis2Map.attr.ageInMonth,
      BA7aQjiwlrL: dhis2Map.attr.ageInYears, // in metadata->"Rv8WM2mTuS5",
      KRNhyZHeGGM: dhis2Map.attr.currentStatus,
      fUxvDvbPKlU: dhis2Map.attr.legalStatus,
      xw5Vres1Ndt: dhis2Map.attr.placeOfLivingAttr,
      iGHeO9F8CKm: dhis2Map.attr.nationalityAttr,
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

  if ([f66Form].includes(encounter.form.uuid)) {
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
      XK6Wnp4aBvi: dhis2Map.attr.placeOfLivingAttr, // Snakebites - Place of living
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
      const value = findDataValue(encounter, dataElement, state);
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
  const f61Form = formIdByName("F61-Travel medicine", state.formMaps);

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
