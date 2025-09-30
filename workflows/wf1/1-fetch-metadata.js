cursor($.manualCursor || $.lastRunDateTime).then((state) => {
  console.log("Date cursor to filter TEI extract ::", state.cursor);
  return state;
});

cursor("now", {
  key: "lastRunDateTime",
  format: (c) => {
    const offset = 2; // GMT+2 (Geneva time)
    c.setHours(c.getHours() + offset);
    return c.toISOString().replace("Z", "");
  },
}).then((state) => {
  console.log("Next sync start date:", state.lastRunDateTime);
  return state;
});

// get(
//   'https://raw.githubusercontent.com/OpenFn/openfn-lime-pilot/refs/heads/collections/metadata/collections.json',
//   { parseAs: 'json' },
//   state => {
//     const { cursor, lastRunDateTime, data } = state;

//     return { ...data, cursor, lastRunDateTime };
//   }
// );

fn((state) => {
  const { cursor, lastRunDateTime } = state;

  const data = {
    lastSync: "2025-09-30T10:18:54.979Z",
    statusMap: {
      no: "a5c5563e-df0e-4742-a335-b24fb63664ee",
      idp: "099856ce-d8ed-46dc-b541-0379858fb93d",
      yes: "681cf0bc-5213-492a-8470-0a0b3cc324dd",
      other: "790b41ce-e1e7-11e8-b02f-0242ac130002",
      single: "20b8524e-4c26-4fa0-81f0-fa23ebacc54d",
      married: "e64097ff-8069-42d5-8670-69f43b2838c5",
      refugee: "c4f005fd-949f-4a15-8f3f-8bc84533274d",
      student: "69c3d769-c1da-4e48-940a-45b5a4ba395a",
      unknown: "ccb4c50d-13e0-46a2-bd5e-51c86d042ad8",
      widowed: "278cf4fc-50e9-45a7-b633-9a3838eb88cf",
      negative: "a3699fc8-1781-48af-aded-2d9e8e233fde",
      positive: "ad30cb86-fe71-4dc5-a5e3-cd6c3f6545c8",
      returnee: "fc49acaa-ece2-4365-9dfb-70c2105de8b1",
      housewife: "9b14b4d4-b749-4acf-acfe-79c480f3c4b3",
      no_status: "2bacead2-f280-457c-9d28-e80e106f7d25",
      unemployed: "743d174f-f9c7-42a2-80cd-9930e4c52787",
      partner_left: "783a300d-5624-4202-90c6-91660a779cab",
      asylum_seeker: "f921ffdd-72ca-4d58-a89b-1fa2e959d110",
      non_displaced: "bbdb287c-4ba1-4944-bd87-eb126c5f9d92",
      fixed_employee: "5a69bbf4-d4f2-455a-a32e-6179cec3f0cd",
      not_applicable: "8fb2f830-52b3-4593-8e8f-5db8e2be7668",
      divorced_separated: "cbd0c027-1101-4fbe-ae90-4551695f1771",
      occasional_employee: "2cb73bee-7f94-4695-89c7-c81187dbc90c",
      internationally_displaced: "515c5abe-4172-4d0c-a991-0de2888228d7",
    },
    syncedAt: "2025-09-30T10:18:54.963Z",
    formMaps: {
      patient: {
        formName: "F00-Registration",
        programId: "w9MSPn5oSqp",
        dataValueMap: {
          FpuGAOu6itZ: "3884dc76-c271-4bcb-8df8-81c6fb897f53",
          Jt9BhFZkvP2: "38ef5485-e67f-4a10-bf36-08304fe63877",
          Qq6xQ2s6LO8: "a9b2c642-097f-43f8-b96b-4d2f50ffd9b1",
          SVoT2cVLd5O: "e363161a-9d5c-4331-8463-238938f018ed",
          WDp4nVor9Z7: "c020e465-d495-4f6b-97fa-6d4c0009fcd2",
          Xvzc9e0JJmp: "24d1fa23-9778-4a8e-9f7b-93f694fc25e2",
          YUIQIA2ClN6: "e0b6ed99-72c4-4847-a442-e9929eac4a0f",
          fa7uwpCKIwa: "c404d489-dcb9-44d9-9c30-c5a64ea0df25",
          mVbzW9TVo7r: "bc851ec1-9fb7-49da-acd7-1a61168002fe",
          qptKDiv9uPl: "ec42d68d-3e23-43de-b8c5-a03bb538e7c7",
          v7k4OcXrWR8: "dd1f7f0f-ccea-4228-9aa8-a8c3b0ea4c3e",
        },
        optionSetMap: [
          { DNOavthBRGL: "ec42d68d-3e23-43de-b8c5-a03bb538e7c7" },
          { qr9jBtm9uvm: "24d1fa23-9778-4a8e-9f7b-93f694fc25e2" },
          { FTbwlOo7CpG: "e0b6ed99-72c4-4847-a442-e9929eac4a0f" },
          { y38Qm3uiuuV: "a9b2c642-097f-43f8-b96b-4d2f50ffd9b1" },
          { G69FtaNkBgp: "3884dc76-c271-4bcb-8df8-81c6fb897f53" },
          { RpW3aZrlHDi: "dd1f7f0f-ccea-4228-9aa8-a8c3b0ea4c3e" },
        ],
        programStage: "MdTtRixaC1B",
      },
      "47ccf9ca-d1a6-3ec1-b474-880a5ab29fee": {
        formName: "F34-mhGAP Closure",
        syncType: "latest",
        programId: "w9MSPn5oSqp",
        dataValueMap: {
          D9Fd8ZJygPd:
            "08cd4b4a-4b0b-4391-987b-b5b3d770d30f-rfe-forms-specifyMobileClinic",
          Di6tE3HKIuz:
            "1bf47398-7786-4f3e-8cae-b84a21f53eba-rfe-forms-totalNumberOfSessions",
          KgBg7yNmBfv: "6545b874-f44d-4d18-9ab1-7a8bb21c0a15-rfe-forms-phq9",
          Sof9AZ6UrV2:
            "0a0c70d2-2ba5-4cb3-941f-b4a9a4a7ec6d-rfe-forms-specifyHealthFacility",
          UYgvmfBTHmJ:
            "790b41ce-e1e7-11e8-b02f-0242ac130002-rfe-forms-patientReferredTo_ifOtherSpecify",
          aIEDqQJxdlR:
            "e08d532b-e56c-43dc-b831-af705654d2dc-rfe-forms-mainLocationOfIntervention_ifOtherSpecify",
          bduR8KPNSeV:
            "8a9d2ace-372f-4413-a1c4-8999f55e2de2-rfe-forms-closureDate",
          c4TiPRUQ56A: "77f1a782-24af-40ba-bac1-b97d9a080f40-rfe-forms-cgiS",
          e9wcjUxG8mD:
            "41e68dee-a2a3-4e6c-9d96-53def5caff52-rfe-forms-specifyMsfHealthFacility",
          gCgVclE0oZf:
            "cce4fc0b-9d64-4918-8583-2449a59aef60-rfe-forms-wasAMentalHealthCertificateProvided",
          hDcpO0zG7Gi:
            "b87a93ff-a4a1-4601-b35d-1e42bfa7e194-rfe-forms-totalNumberOfBeneficiariesInFamilyConsultation",
          iEdamWl0wzQ: "c64dfacd-2fb5-464d-83a9-ebb9eb8d3ab3-rfe-forms-cgiI",
          iHyhvpeywlU:
            "401b2df0-e26f-4f49-9165-6e20a1b8865a-rfe-forms-mainTypeOfConsultation",
          kuVhB0o09ow:
            "82978311-bef9-46f9-9a9a-cc62254b00a6-rfe-forms-mainLocationOfIntervention",
          lvCcX90Ud3h:
            "9e861ef1-e07c-4955-9650-2ebac3138fc3-rfe-forms-typeOfClosure",
          pQG72ee2lkl: "90b3d09c-d296-44d2-8292-8e04377fe027-rfe-forms-mhos",
          unHaNHLF5ef:
            "8fb3bb7d-c935-4b57-8444-1b953470e109-rfe-forms-patientReferredTo",
          yf7WT2UkK7B: "22b16c12-4487-42f4-956c-1890d1f81ac8-rfe-forms-gad7",
        },
        optionSetMap: [
          {
            mimbbLDaZyZ:
              "401b2df0-e26f-4f49-9165-6e20a1b8865a-rfe-forms-mainTypeOfConsultation",
          },
          {
            zdJEZvP5dVf:
              "82978311-bef9-46f9-9a9a-cc62254b00a6-rfe-forms-mainLocationOfIntervention",
          },
          {
            ovpSADYY35a:
              "9e861ef1-e07c-4955-9650-2ebac3138fc3-rfe-forms-typeOfClosure",
          },
          {
            HlTA658wGdn:
              "8fb3bb7d-c935-4b57-8444-1b953470e109-rfe-forms-patientReferredTo",
          },
          {
            kcV89u3gFad: "77f1a782-24af-40ba-bac1-b97d9a080f40-rfe-forms-cgiS",
          },
          {
            kcV89u3gFad: "c64dfacd-2fb5-464d-83a9-ebb9eb8d3ab3-rfe-forms-cgiI",
          },
        ],
        programStage: "wuRtvl5ZXHw",
      },
      "64d35920-6c05-398e-bdf0-a8a671855491": {
        formName: "F30-MHPSS Follow-up",
        syncType: "all",
        programId: "w9MSPn5oSqp",
        dataValueMap: {
          AZUFlZzPN6V:
            "278d3d1e-c02a-4db1-8ab3-8db3b82eb9b5-rfe-forms-patientRescheduled",
          Aj7RmRcG7A4:
            "3dceead1-70d5-4030-b8f3-bda3938af08d-rfe-forms-doesThePatientHaveACurrentSuicidalRisk",
          C5XtlggtVmd: "f94de17e-9771-4711-aabb-c5bb0c022be2-rfe-forms-cgiI",
          CcA8pc2YqWz:
            "d9454e9c-6e3c-45ab-8a9a-834a9353ae11-rfe-forms-sessionNumber",
          DdAY5siLKOY:
            "3b5aa1dd-2d05-4fbd-b8ca-8a7d4ccbf856-rfe-forms-didThePatientSufferNewCriticalEventsSinceTheLastConsultation",
          E7MVMTTdvPi:
            "b87a93ff-a4a1-4601-b35d-1e42bfa7e194-rfe-forms-totalNumberOfBeneficiariesInFamilyConsultation",
          G0hLyxqgcO7:
            "54e8c1b6-6397-4822-89a4-cf81fbc68ce9-rfe-forms-didThePatientMissTheSession",
          GVTXoz0VrAd:
            "5f6e245c-83fc-421b-8d46-061ac773ae71-rfe-forms-followUpSessionRequired",
          HNZHetAtowR:
            "d34d5e93-03d6-494e-8f4c-2d7221227162-rfe-forms-reasonForMissedAppointment",
          K14cCmpYP26:
            "790b41ce-e1e7-11e8-b02f-0242ac130002-rfe-forms-patientReferredTo_ifOtherSpecify",
          L6Jj7Tppr5q:
            "e08d532b-e56c-43dc-b831-af705654d2dc-rfe-forms-locationOfIntervention_ifOtherSpecify",
          LCdm2xe86ln:
            "41e68dee-a2a3-4e6c-9d96-53def5caff52-rfe-forms-specifyMsfHealthFacility",
          LllEEDbbhzz:
            "e0d4e006-85b5-41cb-8a21-e013b1978b8b-rfe-forms-mainNewPrecipitatingEvents3",
          N6GYmCjAhfh:
            "6d3876be-0a27-466d-ad58-92edcc8c31fb-rfe-forms-referralDone",
          UlSJrSD78HS:
            "82978311-bef9-46f9-9a9a-cc62254b00a6-rfe-forms-locationOfIntervention",
          VcUVLwrZAco:
            "54a9b20e-bce5-4d4a-8c9c-e0248a182586-rfe-forms-mainNewPrecipitatingEvents2",
          XjPbncUyYOH:
            "790b41ce-e1e7-11e8-b02f-0242ac130002-rfe-forms-pastOrPrecipitatingEvents_ifOtherSpecify",
          d8Dok4D8Fl4:
            "1a8bf24f-4f36-4971-aad9-ae77f3525738-rfe-forms-typeOfConsultation",
          g99rxDRwLht:
            "5f3d618e-5c89-43bd-8c79-07e4e98c2f23-rfe-forms-phq9Score",
          hprcEVS6ojr:
            "c1a3ed2d-6d9a-453d-9d93-749164a76413-rfe-forms-mainCategoryOfPrecipitatingEvent",
          j8IYwKvxK4q:
            "ccc4f06c-b76a-440d-9b7e-c48ba2c4a0ab-rfe-forms-doesThePatientPresentARiskOfHarmingOthers",
          kkG7XvFkZNs:
            "89e1b4f8-d4c6-491b-bc32-4d4f79a8df9d-rfe-forms-gad7Score",
          mqiPJsWZljN:
            "d5e3d927-f7ce-4fdd-ac4e-6ad0b510b608-rfe-forms-mainNewPrecipitatingEvents1",
          rDOPHD77P6d:
            "edc6f30c-4ff2-4a4f-8b90-ca4502bb97a1-rfe-forms-nextSessionDate",
          rGS6S4jyKu3:
            "08cd4b4a-4b0b-4391-987b-b5b3d770d30f-rfe-forms-specifyMobileClinic",
          sGEOde9q9p9:
            "0a0c70d2-2ba5-4cb3-941f-b4a9a4a7ec6d-rfe-forms-specifyHealthFacility",
          t4HoHWCYdvm:
            "790b41ce-e1e7-11e8-b02f-0242ac130002-rfe-forms-reasonForMissedAppointment_ifOtherSpecify",
          tXMgjzusbbt:
            "b2c5b6e0-66f0-4b9d-8576-b6f48e0a06df-rfe-forms-mhosScore",
          tloy0Bd9qDf:
            "d7410cd3-29be-4f8b-93d6-eb4de005db29-rfe-forms-numberOfAppointmentsMissed",
          vWWl7izQpqd:
            "82d1fcad-d1be-4ea2-a66c-c872fb4825b4-rfe-forms-typeOfIntervention",
          wvVn2LfmNDO:
            "8fb3bb7d-c935-4b57-8444-1b953470e109-rfe-forms-patientReferredTo",
          yTFUtaFJ1QU: "a1a75011-0fef-460a-b666-dda2d171f39b-rfe-forms-cgiS",
          yUT7HyjWurN: "encounter-date",
          yb8WWTuSXWa:
            "8ef009b1-396c-4dda-a816-b688ed66e450-rfe-forms-timeFromTheMainEvent",
        },
        optionSetMap: [
          {
            FYHuq8p4TYP:
              "1a8bf24f-4f36-4971-aad9-ae77f3525738-rfe-forms-typeOfConsultation",
          },
          {
            zdJEZvP5dVf:
              "82978311-bef9-46f9-9a9a-cc62254b00a6-rfe-forms-locationOfIntervention",
          },
          {
            F350PsrQw3Z:
              "82d1fcad-d1be-4ea2-a66c-c872fb4825b4-rfe-forms-typeOfIntervention",
          },
          {
            WlbDv2LELNz:
              "d34d5e93-03d6-494e-8f4c-2d7221227162-rfe-forms-reasonForMissedAppointment",
          },
          {
            yHYkho3rRNV:
              "d5e3d927-f7ce-4fdd-ac4e-6ad0b510b608-rfe-forms-mainNewPrecipitatingEvents1",
          },
          {
            yHYkho3rRNV:
              "54a9b20e-bce5-4d4a-8c9c-e0248a182586-rfe-forms-mainNewPrecipitatingEvents2",
          },
          {
            yHYkho3rRNV:
              "e0d4e006-85b5-41cb-8a21-e013b1978b8b-rfe-forms-mainNewPrecipitatingEvents3",
          },
          {
            kjuVu7bQnEj:
              "c1a3ed2d-6d9a-453d-9d93-749164a76413-rfe-forms-mainCategoryOfPrecipitatingEvent",
          },
          {
            PrY9ZXhHbhd:
              "8ef009b1-396c-4dda-a816-b688ed66e450-rfe-forms-timeFromTheMainEvent",
          },
          {
            kcV89u3gFad: "a1a75011-0fef-460a-b666-dda2d171f39b-rfe-forms-cgiS",
          },
          {
            kcV89u3gFad: "f94de17e-9771-4711-aabb-c5bb0c022be2-rfe-forms-cgiI",
          },
          {
            Zu6s2NWggMt:
              "8fb3bb7d-c935-4b57-8444-1b953470e109-rfe-forms-patientReferredTo",
          },
        ],
        programStage: "eUCtSH80vMe",
      },
      "91f52388-7066-3263-b964-5e63b4f4e51d": {
        formName: "F33-MHPSS Closure",
        syncType: "latest",
        programId: "w9MSPn5oSqp",
        dataValueMap: {
          ELQvFZjc8dL:
            "0a0c70d2-2ba5-4cb3-941f-b4a9a4a7ec6d-rfe-forms-specifyHealthFacility",
          F3wIwerMIML:
            "8fb3bb7d-c935-4b57-8444-1b953470e109-rfe-forms-patientReferredTo",
          KgBg7yNmBfv: "6545b874-f44d-4d18-9ab1-7a8bb21c0a15-rfe-forms-phq9",
          Lht8GKTAHu8:
            "9e861ef1-e07c-4955-9650-2ebac3138fc3-rfe-forms-typeOfClosure",
          QJxbUPjoIoo:
            "1bf47398-7786-4f3e-8cae-b84a21f53eba-rfe-forms-totalNumberOfSessions",
          RoBHeg55Mle:
            "8a9d2ace-372f-4413-a1c4-8999f55e2de2-rfe-forms-closureDate",
          Sk1nVubpSFa:
            "e08d532b-e56c-43dc-b831-af705654d2dc-rfe-forms-mainLocationOfIntervention_ifOtherSpecify",
          TqjvJA0GUOA:
            "401b2df0-e26f-4f49-9165-6e20a1b8865a-rfe-forms-mainTypeOfConsultation",
          XhtEvGwiYDK:
            "08cd4b4a-4b0b-4391-987b-b5b3d770d30f-rfe-forms-specifyMobileClinic",
          Xk59Xw9eyzS:
            "b87a93ff-a4a1-4601-b35d-1e42bfa7e194-rfe-forms-totalNumberOfBeneficiariesInFamilyConsultation",
          c4TiPRUQ56A: "77f1a782-24af-40ba-bac1-b97d9a080f40-rfe-forms-cgiS",
          iEdamWl0wzQ: "c64dfacd-2fb5-464d-83a9-ebb9eb8d3ab3-rfe-forms-cgiI",
          pQG72ee2lkl: "90b3d09c-d296-44d2-8292-8e04377fe027-rfe-forms-mhos",
          pjVuvx8Xq6m:
            "41e68dee-a2a3-4e6c-9d96-53def5caff52-rfe-forms-specifyMsfHealthFacility",
          taSJ2FDYTP2:
            "82978311-bef9-46f9-9a9a-cc62254b00a6-rfe-forms-mainLocationOfIntervention",
          treBZpHPfYk:
            "cce4fc0b-9d64-4918-8583-2449a59aef60-rfe-forms-wasAMentalHealthCertificateProvided",
          vmRaiCPePwY:
            "790b41ce-e1e7-11e8-b02f-0242ac130002-rfe-forms-patientReferredTo_ifOtherSpecify",
          yf7WT2UkK7B: "22b16c12-4487-42f4-956c-1890d1f81ac8-rfe-forms-gad7",
        },
        optionSetMap: [
          {
            mimbbLDaZyZ:
              "401b2df0-e26f-4f49-9165-6e20a1b8865a-rfe-forms-mainTypeOfConsultation",
          },
          {
            zdJEZvP5dVf:
              "82978311-bef9-46f9-9a9a-cc62254b00a6-rfe-forms-mainLocationOfIntervention",
          },
          {
            ovpSADYY35a:
              "9e861ef1-e07c-4955-9650-2ebac3138fc3-rfe-forms-typeOfClosure",
          },
          {
            Zu6s2NWggMt:
              "8fb3bb7d-c935-4b57-8444-1b953470e109-rfe-forms-patientReferredTo",
          },
          {
            kcV89u3gFad: "77f1a782-24af-40ba-bac1-b97d9a080f40-rfe-forms-cgiS",
          },
          {
            kcV89u3gFad: "c64dfacd-2fb5-464d-83a9-ebb9eb8d3ab3-rfe-forms-cgiI",
          },
        ],
        programStage: "xrCTheIzyDV",
      },
      "ae41c62a-da26-3a4b-ac75-e7df52f77ec3": {
        formName: "F32-mhGAP Follow-up",
        syncType: "all",
        programId: "w9MSPn5oSqp",
        dataValueMap: {
          AZUFlZzPN6V:
            "278d3d1e-c02a-4db1-8ab3-8db3b82eb9b5-rfe-forms-patientRescheduled",
          AiUr0KZgS9e:
            "dbf35880-d18e-4f15-ad9c-97b5b053e14a-rfe-forms-isThePatientTakingTheMedicationAsPrescribed",
          C5XtlggtVmd: "f94de17e-9771-4711-aabb-c5bb0c022be2-rfe-forms-cgiI",
          CcA8pc2YqWz:
            "d9454e9c-6e3c-45ab-8a9a-834a9353ae11-rfe-forms-sessionNumber",
          EOFi7nk2vNM: "encounter-date",
          G0hLyxqgcO7:
            "54e8c1b6-6397-4822-89a4-cf81fbc68ce9-rfe-forms-didThePatientMissTheSession",
          HNZHetAtowR:
            "d34d5e93-03d6-494e-8f4c-2d7221227162-rfe-forms-reasonForMissedAppointment",
          M3rgdQLmO05:
            "edc6f30c-4ff2-4a4f-8b90-ca4502bb97a1-rfe-forms-nextSessionDate",
          MDbDqs5Mwow:
            "22809b19-54ca-4d88-8d26-9577637c184e-rfe-forms-changeInDiagnosis",
          OBAHc3Rljln:
            "dc072a1a-20d8-4512-9e57-3585a07cb074-rfe-forms-detailsIfNeeded",
          TQoTxyjJFQ7:
            "5f6e245c-83fc-421b-8d46-061ac773ae71-rfe-forms-followUpSessionRequired",
          TXI3rYzJhwI:
            "8fb3bb7d-c935-4b57-8444-1b953470e109-rfe-forms-patientReferredTo",
          alPaUDxtrdg:
            "5f3d618e-5c89-43bd-8c79-07e4e98c2f23-rfe-forms-phq9Score",
          frNSzbtH78y:
            "790b41ce-e1e7-11e8-b02f-0242ac130002-rfe-forms-patientReferredTo_ifOtherSpecify",
          kkG7XvFkZNs:
            "89e1b4f8-d4c6-491b-bc32-4d4f79a8df9d-rfe-forms-gad7Score",
          t4HoHWCYdvm:
            "790b41ce-e1e7-11e8-b02f-0242ac130002-rfe-forms-reasonForMissedAppointment_ifOtherSpecify",
          tXMgjzusbbt:
            "b2c5b6e0-66f0-4b9d-8576-b6f48e0a06df-rfe-forms-mhosScore",
          tloy0Bd9qDf:
            "d7410cd3-29be-4f8b-93d6-eb4de005db29-rfe-forms-numberOfAppointmentsMissed",
          yTFUtaFJ1QU: "a1a75011-0fef-460a-b666-dda2d171f39b-rfe-forms-cgiS",
          z3dmWfX5OSX:
            "6d3876be-0a27-466d-ad58-92edcc8c31fb-rfe-forms-referralDone",
        },
        optionSetMap: [
          {
            WlbDv2LELNz:
              "d34d5e93-03d6-494e-8f4c-2d7221227162-rfe-forms-reasonForMissedAppointment",
          },
          {
            kcV89u3gFad: "a1a75011-0fef-460a-b666-dda2d171f39b-rfe-forms-cgiS",
          },
          {
            kcV89u3gFad: "f94de17e-9771-4711-aabb-c5bb0c022be2-rfe-forms-cgiI",
          },
          {
            flvpQl6fVkp:
              "22809b19-54ca-4d88-8d26-9577637c184e-rfe-forms-changeInDiagnosis",
          },
          {
            YMqd6cittuS:
              "5f6e245c-83fc-421b-8d46-061ac773ae71-rfe-forms-followUpSessionRequired",
          },
          {
            HlTA658wGdn:
              "8fb3bb7d-c935-4b57-8444-1b953470e109-rfe-forms-patientReferredTo",
          },
        ],
        programStage: "hjHwYnSfJnX",
      },
      "d94898ae-6414-3ec5-8225-febf06eb1833": {
        formName: "F29-MHPSS Baseline",
        syncType: "latest",
        programId: "w9MSPn5oSqp",
        dataValueMap: {
          Aggyv8LqQbn:
            "8ef009b1-396c-4dda-a816-b688ed66e450-rfe-forms-timeFromTheMainEvent",
          AuDPJg6gZE7:
            "82978311-bef9-46f9-9a9a-cc62254b00a6-rfe-forms-locationOfIntervention",
          CLGnlnFqqnk:
            "0a0c70d2-2ba5-4cb3-941f-b4a9a4a7ec6d-rfe-forms-specifyHealthFacility",
          CUdI1BJ5W8G:
            "92a92f62-3ff6-4944-9ea9-a7af23949bad-rfe-forms-currentSymptomsOrComplaints3",
          CXS4qAJH2qD: "encounter-date",
          DMaLm9u4GCq:
            "b87a93ff-a4a1-4601-b35d-1e42bfa7e194-rfe-forms-totalNumberOfBeneficiariesInFamilyConsultation",
          DlqJSA5VApl:
            "8fb3bb7d-c935-4b57-8444-1b953470e109-rfe-forms-patientReferredTo",
          EJwuSLCkYrh:
            "edc6f30c-4ff2-4a4f-8b90-ca4502bb97a1-rfe-forms-nextSessionDate",
          EkZqB9eL0W5:
            "3dceead1-70d5-4030-b8f3-bda3938af08d-rfe-forms-doesThePatientHaveACurrentSuicidalRisk",
          FLIlRjAwn4G:
            "e0d4e006-85b5-41cb-8a21-e013b1978b8b-rfe-forms-mainPastOrPrecipitatingEvents3",
          JUabDHhT1wJ:
            "c1a3ed2d-6d9a-453d-9d93-749164a76413-rfe-forms-mainCategoryOfPrecipitatingEvent",
          KSBMR1BDGwx:
            "1a8bf24f-4f36-4971-aad9-ae77f3525738-rfe-forms-typeOfConsultation",
          KeyiEPc4pII:
            "82d1fcad-d1be-4ea2-a66c-c872fb4825b4-rfe-forms-typeOfIntervention",
          KjgDauY9v4J:
            "e08d532b-e56c-43dc-b831-af705654d2dc-rfe-forms-locationOfIntervention_ifOtherSpecify",
          LVtCRRo22k3:
            "790b41ce-e1e7-11e8-b02f-0242ac130002-rfe-forms-specificReferralSource_ifOtherSpecify",
          METV1exWuZg:
            "22809b19-54ca-4d88-8d26-9577637c184e-rfe-forms-concomitantDiagnosis",
          MF3RML0HLbP:
            "b2c5b6e0-66f0-4b9d-8576-b6f48e0a06df-rfe-forms-mhosScore",
          PCGI7EnvCQS:
            "45b39cbf-0fb2-4682-8544-8aaf3e07a744-rfe-forms-currentSymptomsOrComplaints1",
          QpSVAp9m5uC:
            "790b41ce-e1e7-11e8-b02f-0242ac130002-rfe-forms-concomitantDiagnosis_ifOtherSpecify",
          RiiH9A53rvG:
            "6d3876be-0a27-466d-ad58-92edcc8c31fb-rfe-forms-referralDone",
          RnbiVrrSFdm:
            "ee1b7973-e931-494e-a9cb-22b814b4d8ed-rfe-forms-currentSymptomsOrComplaints2",
          RqsvaPH9vHt:
            "22809b19-54ca-4d88-8d26-9577637c184e-rfe-forms-mainDiagnosis",
          SsQqwDBGxjh:
            "54a9b20e-bce5-4d4a-8c9c-e0248a182586-rfe-forms-mainPastOrPrecipitatingEvents2",
          TWuCY5r2wx7:
            "ccc4f06c-b76a-440d-9b7e-c48ba2c4a0ab-rfe-forms-doesThePatientPresentARiskOfHarmingOthers",
          W7cPAi8iXLZ:
            "819f79e7-b9af-4afd-85d4-2ab677223113-rfe-forms-mainDiagnosisIfOtherSpecify",
          WpRshJ2dmPl:
            "89e1b4f8-d4c6-491b-bc32-4d4f79a8df9d-rfe-forms-gad7Score",
          YeaUNruqmca:
            "08cd4b4a-4b0b-4391-987b-b5b3d770d30f-rfe-forms-specifyMobileClinic",
          YfcNA5bvkxT:
            "9a8204ca-d908-4157-9285-7c970dbb5287-rfe-forms-mainSyndrome",
          f64XCwzJW02:
            "41e68dee-a2a3-4e6c-9d96-53def5caff52-rfe-forms-specifyMsfHealthFacility",
          iistu8GbCdC:
            "fb359236-733b-42e0-bec3-e7bb0785985f-rfe-forms-knowledgeOfTheService",
          kdGseg7UE9M:
            "25ab1831-52a1-46ea-b4f5-a82b50efb396-rfe-forms-dateOfTheMainDiagnosis",
          m8qis4iUOTo:
            "790b41ce-e1e7-11e8-b02f-0242ac130002-rfe-forms-pastOrPrecipitatingEvents_ifOtherSpecify",
          mDbXCwybfxo:
            "6d722abd-9bd8-4c32-88d3-5a0b5f0d4aa0-rfe-forms-mainReferralSource",
          pj5hIE6iyAR:
            "e08d532b-e56c-43dc-b831-af705654d2dc-rfe-forms-currentSymptomsOrComplaints_ifOtherSpecify",
          qacGXlyyQOS:
            "a1a75011-0fef-460a-b666-dda2d171f39b-rfe-forms-cgiSScoreHowMentallyIllIsThePatientAtThisTime",
          qfYPXP76j8g:
            "c3c86c1b-07be-4506-ab25-8f35f4389b19-rfe-forms-specificReferralSource",
          rSIazMFEBjD:
            "4dae5b12-070f-4153-b1ca-fbec906106e1-rfe-forms-admissionType",
          u4OFYTJ81rP:
            "5f3d618e-5c89-43bd-8c79-07e4e98c2f23-rfe-forms-phq9Score",
          v0qFX0qv1tX:
            "d5e3d927-f7ce-4fdd-ac4e-6ad0b510b608-rfe-forms-mainPastOrPrecipitatingEvents1",
          vC3bg9NwJ78:
            "3edcfddb-7988-4ce5-97a0-d4c46b267a04-rfe-forms-durationOfTheMainSymptom",
          xz4g0Dc9iQi:
            "790b41ce-e1e7-11e8-b02f-0242ac130002-rfe-forms-patientReferredTo_ifOtherSpecify",
          yCwuZ0htrlH:
            "5f6e245c-83fc-421b-8d46-061ac773ae71-rfe-forms-followUpSessionRequired",
          ztw3FbScyEK:
            "ce98fb42-1576-4168-892f-6d316ae22495-rfe-forms-permissionToBeContactedInCaseOfNeed",
        },
        optionSetMap: [
          {
            wTGMuMQQwmQ:
              "4dae5b12-070f-4153-b1ca-fbec906106e1-rfe-forms-admissionType",
          },
          {
            F350PsrQw3Z:
              "82d1fcad-d1be-4ea2-a66c-c872fb4825b4-rfe-forms-typeOfIntervention",
          },
          {
            O72UnPJGuKC:
              "1a8bf24f-4f36-4971-aad9-ae77f3525738-rfe-forms-typeOfConsultation",
          },
          {
            zdJEZvP5dVf:
              "82978311-bef9-46f9-9a9a-cc62254b00a6-rfe-forms-locationOfIntervention",
          },
          {
            R2urD1F9b7J:
              "ce98fb42-1576-4168-892f-6d316ae22495-rfe-forms-permissionToBeContactedInCaseOfNeed",
          },
          {
            uev9jdVIPiA:
              "fb359236-733b-42e0-bec3-e7bb0785985f-rfe-forms-knowledgeOfTheService",
          },
          {
            ecwWFbc3j1s:
              "6d722abd-9bd8-4c32-88d3-5a0b5f0d4aa0-rfe-forms-mainReferralSource",
          },
          {
            xZNOeqJ7DuL:
              "c3c86c1b-07be-4506-ab25-8f35f4389b19-rfe-forms-specificReferralSource",
          },
          {
            MRNqXzrPl0H:
              "45b39cbf-0fb2-4682-8544-8aaf3e07a744-rfe-forms-currentSymptomsOrComplaints1",
          },
          {
            MRNqXzrPl0H:
              "ee1b7973-e931-494e-a9cb-22b814b4d8ed-rfe-forms-currentSymptomsOrComplaints2",
          },
          {
            MRNqXzrPl0H:
              "92a92f62-3ff6-4944-9ea9-a7af23949bad-rfe-forms-currentSymptomsOrComplaints3",
          },
          {
            ErGIyIc33Sw:
              "9a8204ca-d908-4157-9285-7c970dbb5287-rfe-forms-mainSyndrome",
          },
          {
            CzXDqkzN6Nq:
              "3edcfddb-7988-4ce5-97a0-d4c46b267a04-rfe-forms-durationOfTheMainSymptom",
          },
          {
            kcV89u3gFad:
              "a1a75011-0fef-460a-b666-dda2d171f39b-rfe-forms-cgiSScoreHowMentallyIllIsThePatientAtThisTime",
          },
          {
            flvpQl6fVkp:
              "22809b19-54ca-4d88-8d26-9577637c184e-rfe-forms-mainDiagnosis",
          },
          {
            flvpQl6fVkp:
              "22809b19-54ca-4d88-8d26-9577637c184e-rfe-forms-concomitantDiagnosis",
          },
          {
            yHYkho3rRNV:
              "d5e3d927-f7ce-4fdd-ac4e-6ad0b510b608-rfe-forms-mainPastOrPrecipitatingEvents1",
          },
          {
            yHYkho3rRNV:
              "54a9b20e-bce5-4d4a-8c9c-e0248a182586-rfe-forms-mainPastOrPrecipitatingEvents2",
          },
          {
            yHYkho3rRNV:
              "e0d4e006-85b5-41cb-8a21-e013b1978b8b-rfe-forms-mainPastOrPrecipitatingEvents3",
          },
          {
            kjuVu7bQnEj:
              "c1a3ed2d-6d9a-453d-9d93-749164a76413-rfe-forms-mainCategoryOfPrecipitatingEvent",
          },
          {
            PrY9ZXhHbhd:
              "8ef009b1-396c-4dda-a816-b688ed66e450-rfe-forms-timeFromTheMainEvent",
          },
          {
            Zu6s2NWggMt:
              "8fb3bb7d-c935-4b57-8444-1b953470e109-rfe-forms-patientReferredTo",
          },
        ],
        programStage: "MdTtRixaC1B",
      },
      "d9a26c5d-8517-39ac-a14c-dbd1a54d14f6": {
        formName: "F31-mhGAP Baseline",
        syncType: "latest",
        programId: "w9MSPn5oSqp",
        dataValueMap: {
          Ajaeo8ZkDur:
            "8fb3bb7d-c935-4b57-8444-1b953470e109-rfe-forms-patientReferredTo",
          BNG4w26EI2s:
            "6d3876be-0a27-466d-ad58-92edcc8c31fb-rfe-forms-referralDone",
          DCEJHFQvPWa:
            "5f3d618e-5c89-43bd-8c79-07e4e98c2f23-rfe-forms-phq9Score",
          G8mgHN9Jm2c:
            "790b41ce-e1e7-11e8-b02f-0242ac130002-rfe-forms-patientReferredTo_ifOtherSpecify",
          I7phgLmRWQq: "encounter-date",
          METV1exWuZg:
            "22809b19-54ca-4d88-8d26-9577637c184e-rfe-forms-concomitantDiagnosis",
          MF3RML0HLbP:
            "b2c5b6e0-66f0-4b9d-8576-b6f48e0a06df-rfe-forms-mhosScore",
          QpSVAp9m5uC:
            "790b41ce-e1e7-11e8-b02f-0242ac130002-rfe-forms-concomitantDiagnosis_ifOtherSpecify",
          R3g94vJ2yFR:
            "22809b19-54ca-4d88-8d26-9577637c184e-rfe-forms-mainDiagnosis",
          SOR54p6CGTx:
            "5f6e245c-83fc-421b-8d46-061ac773ae71-rfe-forms-followUpSessionRequired",
          VnXwFYqHNqM:
            "15748787-7372-4022-b5d4-81ff8d6887ca-rfe-forms-olderAdult",
          WpRshJ2dmPl:
            "89e1b4f8-d4c6-491b-bc32-4d4f79a8df9d-rfe-forms-gad7Score",
          Yt4NhxZU5Vo:
            "790b41ce-e1e7-11e8-b02f-0242ac130002-rfe-forms-mainDiagnosis_ifOtherSpecify",
          hMcCdEkhhjZ:
            "f6cefc80-506a-44b0-ab5f-d6f5908cf7a5-rfe-forms-childOrAdolescent",
          kdGseg7UE9M:
            "25ab1831-52a1-46ea-b4f5-a82b50efb396-rfe-forms-dateOfTheMainDiagnosis",
          pHoZYTrR7N0:
            "2be92591-da1b-4418-ba49-43b3fc0e4ce5-rfe-forms-pregnantOrBreastfeeding",
          pPy6lKptm1T:
            "3dceead1-70d5-4030-b8f3-bda3938af08d-rfe-forms-doesThePatientHaveACurrentSuicidalRisk",
          qCRNMAevGF9:
            "edc6f30c-4ff2-4a4f-8b90-ca4502bb97a1-rfe-forms-nextSessionDate",
          qacGXlyyQOS: "a1a75011-0fef-460a-b666-dda2d171f39b-rfe-forms-cgiS",
          rSIazMFEBjD:
            "4dae5b12-070f-4153-b1ca-fbec906106e1-rfe-forms-admissionType",
          vLfsElaDxZf:
            "af23b916-3e95-4bd4-8804-a4b1649ff365-rfe-forms-historyOfSelfHarmOrSuicide",
          zwMoLjEgFC3:
            "c3c86c1b-07be-4506-ab25-8f35f4389b19-rfe-forms-referralSource",
        },
        optionSetMap: [
          {
            pNEmG0RefTw:
              "c3c86c1b-07be-4506-ab25-8f35f4389b19-rfe-forms-referralSource",
          },
          {
            wTGMuMQQwmQ:
              "4dae5b12-070f-4153-b1ca-fbec906106e1-rfe-forms-admissionType",
          },
          {
            kcV89u3gFad: "a1a75011-0fef-460a-b666-dda2d171f39b-rfe-forms-cgiS",
          },
          {
            flvpQl6fVkp:
              "22809b19-54ca-4d88-8d26-9577637c184e-rfe-forms-mainDiagnosis",
          },
          {
            flvpQl6fVkp:
              "22809b19-54ca-4d88-8d26-9577637c184e-rfe-forms-concomitantDiagnosis",
          },
          {
            YMqd6cittuS:
              "5f6e245c-83fc-421b-8d46-061ac773ae71-rfe-forms-followUpSessionRequired",
          },
          {
            HlTA658wGdn:
              "8fb3bb7d-c935-4b57-8444-1b953470e109-rfe-forms-patientReferredTo",
          },
        ],
        programStage: "EZJ9FsNau7Q",
      },
    },
    sourceFile: "LIME EMR - Iraq Metadata - Release 1 -v2025-09-25.xlsx",
    identifiers: [
      {
        type: "DHIS2_PATIENT_NUMBER",
        description: "DHIS2 Patient Number",
        "example value": "ER-IQ2024-1234",
        "dhis2 attribute id": "P4wdYGkldeG",
        "omrs identifierType": "8d79403a-c2cc-11de-8d13-0010c6dffd0f",
      },
      {
        type: "OPENMRS_AUTO_ID",
        description: "OpenMRS Patient Number",
        "example value": "IQ146-24-000-027",
        "dhis2 attribute id": "ZBoxuExmxcZ",
        "omrs identifierType": "05a29f94-c0ed-11e2-94be-8c13b969e334",
      },
      { type: "ORG_UNIT", "dhis2 attribute id": "OPjuJMZFLop" },
      { type: "PROGRAM", "dhis2 attribute id": "w9MSPn5oSqp" },
    ],
    fileDateModified: "2025-09-30T10:16:38Z",
    nationalityMap: {
      chad: "9e41e71c-f5d5-456c-a6f9-2129b8055bfc",
      cuba: "147c2434-5d7e-420c-8053-ba623301f3f5",
      guam: "51fa502b-98a3-4c42-b5fd-7b4d64489bb9",
      iran: "b422270e-d8af-4a32-b523-742545a17a3f",
      iraq: "03aa7d6e-7656-48e4-8dc0-5e27706722c0",
      laos: "dfb01b39-c224-459e-b045-dd9461b9a1e5",
      mali: "3e844a47-526a-46f9-afea-1af9ff8690aa",
      oman: "9b0af037-99d1-43b8-ac06-82137ec4b06d",
      peru: "e74fa87f-8469-46b0-975f-6cb37c394564",
      togo: "6a583e64-869d-477d-a1c1-746320d45fc4",
      aruba: "f3f1cba1-7c1e-4234-86a2-f27bb5964fee",
      benin: "cf863e31-bb38-48ed-90dd-f3dedcac304c",
      chile: "05333883-44e9-4f57-836a-041391803007",
      china: "15016874-3e20-484a-baa8-9b94e1a3d358",
      egypt: "cc7343f8-9243-4d09-b378-58363850d624",
      gabon: "9f46ae06-114a-47fa-8f8d-e9749f04da25",
      ghana: "2eb4ff46-d908-4148-9b0d-40ccfc1a655a",
      haiti: "f76f7dcb-f82e-4257-a627-1685ff3f3586",
      india: "378d0107-eb43-485d-930c-0704b4e5aa11",
      kenya: "ad351a33-8846-4cad-8195-b07b6041d4a5",
      libya: "600c6af4-b767-423c-b942-7f06ca467258",
      nauru: "3386fe63-2158-4040-a502-9f65fd2079d3",
      nepal: "fb01b01a-6775-423c-8012-7d43f587cb6c",
      niger: "7561db90-a866-4443-93f4-95cac1d47e9c",
      other: "790b41ce-e1e7-11e8-b02f-0242ac130002",
      samoa: "e03b381b-a7f4-40eb-964f-51571dc3c48c",
      sudan: "2f03a932-2b75-4e8b-9f44-0fcd83c75dc4",
      syria: "1e34ee55-ef9f-4386-bae6-6995555ded75",
      tonga: "d381f06d-2365-4f40-948b-cfe90d8cb532",
      yemen: "6a3214e0-f94b-414c-8148-968e24386671",
      angola: "8a2e5a03-8a74-41ae-9a98-2310f9ce400d",
      bhutan: "d45a57c9-994f-4deb-8845-9b785860a2ec",
      brazil: "353ff388-64e6-434c-b78f-ca9636390389",
      gambia: "5ec7ddd7-14a5-48ec-9e7c-8896d1010655",
      greece: "b75d6bcc-fadf-4141-8d0f-2463154b89f7",
      guinea: "eeaff39c-8afd-43f7-b9a0-53729f5df1d8",
      guyana: "ba4dfa7e-f3cd-4e94-8ca7-6b96a93378a8",
      jordan: "842f963c-f84d-4076-a8db-337295fd9b91",
      kuwait: "4aee7a88-cda9-454e-9f25-4a6420270417",
      malawi: "e8b5f188-6a5c-43ae-b4a5-200abb13153e",
      mexico: "8381208f-01ca-4ed3-8f2c-f73ed1c316e3",
      panama: "1ef5a828-9d0d-4336-91ab-880d5dc0151c",
      rwanda: "6bc925a1-7699-496a-85b0-c290699381db",
      serbia: "d2e69cef-3bff-4220-ba91-a6a678fb606b",
      turkey: "7429c779-1d3a-4aec-8256-d0b1637e1bd1",
      uganda: "be3d11d3-446d-440c-a582-d01c7cbb0eda",
      zambia: "3ec0432d-ea37-4159-a658-29d6f07fe21a",
      albania: "db21f4f9-faf2-4358-8297-0ae76627b3b8",
      algeria: "5f6c017f-074c-46b3-92d0-d055e2094366",
      armenia: "39f1652a-f2b7-4b65-a7e1-7097ac6cdef0",
      belarus: "664baba4-c552-47b9-97c0-ff67dafd27d6",
      bolivia: "d8800d10-862b-42f1-8e22-cac1ce1bbcae",
      burundi: "8a2ed0db-eaad-44bc-bf06-5cb1b2a3db0b",
      comoros: "9d8738c8-40c2-4c66-aabb-ef176a20ffe8",
      ecuador: "f9810f9a-78a7-42a2-99e6-19c629642386",
      eritrea: "c61f03c2-0d1f-444f-a974-0a61063aff71",
      georgia: "bc71788f-db69-4b6f-8d1c-57a74395bdd2",
      lebanon: "7de78f22-f53e-48d2-923f-ae1e4d814f46",
      lesotho: "b35b29c5-9bb7-4b40-ad33-29eecd28a9e6",
      liberia: "a5fd61b4-fd27-433d-8428-7e88a7f27921",
      mayotte: "1af148fe-2698-4b89-bf7f-87e5c48b6848",
      moldova: "f0e9c8b5-69b5-48df-8cb9-2d089ba04e46",
      morocco: "ef467a17-91e8-4124-a136-7ed8ff7c7d15",
      myanmar: "e81ba700-f9fc-4ed0-b248-578a25717cdb",
      namibia: "0cb123dc-8810-4840-b6ab-6a527c5a79ef",
      nigeria: "4134651a-7f53-45fb-8bc6-7fed9cf36f51",
      reunion: "1dae4b2d-50c9-4bf1-b25a-7063600a5e74",
      romania: "457e745e-ae97-463d-95a9-8d5689d3ca2b",
      senegal: "ad948f1b-0733-4f8d-b049-d64289b43a10",
      somalia: "99c8dccc-4dfa-4d30-86be-42a309ab431f",
      tunisia: "56be7864-fde6-4db3-8fa5-b9dd42cd9c53",
      ukraine: "38c99c8d-2b93-4848-a537-b1865a260bb2",
      unknown: "ccb4c50d-13e0-46a2-bd5e-51c86d042ad8",
      uruguay: "c2e45baf-748b-4d7b-a391-ed6b802b6f94",
      vietnam: "49509c5f-e533-48a8-bf06-86935e3376b2",
      anguilla: "c911af8a-171c-4ee9-b1ff-934373e8a819",
      botswana: "1304a0de-5b70-4d36-a873-e72a82963316",
      bulgaria: "91c85a62-2b02-483a-aefd-e29d368565fe",
      cambodia: "4fd14df8-8279-4dfa-bdd3-e1ab26bc0264",
      cameroon: "873552ac-9850-4cc1-ae09-17eb0fccf405",
      colombia: "a008dff8-ce96-4662-bf8a-372e43d424f0",
      djibouti: "cf5b334f-1c0f-41fc-ab54-53ff1e942830",
      dominica: "f70e51e5-b76c-4c38-9bf2-ef8e1f308ce1",
      ethiopia: "7478d375-014e-410e-a355-090143e88f5b",
      honduras: "cdd1336e-495b-4868-aace-57a84442d6fd",
      malaysia: "3facca11-fbaa-4c40-8fac-4751d45c3f1b",
      mongolia: "9f341cb1-dcb5-4f6c-bd21-b57db01b4193",
      pakistan: "f45d93c3-c9b0-4333-a5e6-299b7c425812",
      paraguay: "d8412016-82f5-4801-a026-1bdc429850b7",
      suriname: "c65d3329-98d4-4dd7-89d3-141b70d00eb2",
      tanzania: "050a8eb1-0d77-4f65-a2da-776a13bcd2a4",
      thailand: "289ac5bd-6434-4837-86bf-b54d22970ac8",
      zimbabwe: "ce1b0d8d-0a2d-4f93-a6ed-64aca2fd0f45",
      argentina: "b83d24e8-34d8-4920-83c0-8ba014467ff4",
      drc_congo: "8f6d3d2a-e09f-473b-99c9-e539f97ceab6",
      guatemala: "3725a4d2-b28f-466b-905a-bafeaeb75855",
      indonesia: "1cbe17e6-adc2-4680-bee0-54d94af75ebf",
      macedonia: "5837cc40-9ab5-4088-91c8-ca6e4b57e903",
      mauritius: "17ced083-eb2a-4046-a713-26cabc7af95d",
      nicaragua: "f6a9521c-596b-49f9-b914-67138e8c17e6",
      palestina: "e2a19948-49aa-44c0-98ef-67ae1160ef43",
      sri_lanka: "b0031c01-d242-4410-b98b-cc1511590b85",
      swaziland: "06a2703b-af17-4e44-83f5-6cc9a8a75320",
      venezuela: "557cea4a-0049-4b7a-b373-ed63f294a2a0",
      azerbaijan: "29750013-0e35-47ca-8f77-9192a923fb07",
      bangladesh: "a99de53c-ce76-4b1e-91b2-461094baf79e",
      cape_verde: "cfbc220a-1d6c-4469-bb6d-a8e3deb4f7e7",
      costa_rica: "fb52f8c9-40ec-4dc4-92a4-d465612de2ff",
      east_timor: "854f2f66-40e1-4a6a-9dee-09c832a52289",
      kazakhstan: "6f6d0e78-2c81-411d-8d13-367e250dc110",
      kyrgyzstan: "ace3b851-042b-46a6-8fea-68aae042d614",
      madagascar: "3782bf3c-380e-4b60-b21a-38199073f112",
      martinique: "051ce04e-05e8-4430-8b75-3e499bbffbc8",
      mauritania: "8acb006b-8596-4a98-8177-acb4cb575956",
      mozambique: "0916133b-4d93-4d60-9c20-e7ee3936f391",
      tajikistan: "34836c60-5449-48d6-b3c9-c0b3361b9f2c",
      uzbekistan: "60512350-d79b-41aa-aff0-1b28ca4aa5f1",
      afghanistan: "84066564-253e-43d8-b141-76730cffa878",
      el_salvador: "9a34935e-5a8a-45be-8ccd-cb23192e420f",
      north_korea: "4d3079e4-8568-48e6-9342-665896875a38",
      philippines: "bdbd5c9f-1f28-4f4d-a254-4a84f8bb2c8f",
      puerto_rico: "39fca1d0-d2e7-4b13-82bd-626fbec71252",
      south_korea: "0603d6b9-334f-4443-ab60-7c5d457b95fc",
      south_sudan: "f113e24e-2ea9-49a2-9b28-59241b9adb21",
      switzerland: "dcdcdc70-a006-4b0a-bac2-7de89b022b65",
      burkina_faso: "6c90c1ae-17a4-4e94-a267-4fba4c94efd8",
      cote_divoire: "513cb36a-3f67-46ea-a789-fcdaca0e26f5",
      saudi_arabia: "fdf495a4-e60c-46f7-a8a2-61a216849086",
      sierra_leone: "ffba9caf-b6aa-4078-845e-578f7a7fd566",
      south_africa: "75882d62-1c55-480d-b411-8ca40c3307df",
      turkmenistan: "3ef17df5-299b-4385-9ea6-572df4b6f9ca",
      guinea_bissau: "14e90203-9197-42ea-9222-acafd2fd6984",
      new_caledonia: "e67c072b-7707-491f-8c2e-13c914216b61",
      western_sahara: "4086dfd2-f4f5-4107-93e8-07bee235af8f",
      papua_new_guinea: "e1e6b451-d7fe-4954-b225-99b2de82a4c0",
      equatorial_guinea: "7e591605-d723-4398-982a-8737af63a2dc",
      republic_of_congo: "5db9afa5-b57e-4f45-8b1c-af766f14fc58",
      dominican_republic: "ce72fc9b-619b-4c32-b865-600e888ad814",
      sao_tome_and_principe: "f66bbb42-684f-42d7-bfcd-95d586eb7dc9",
      bosnia_and_herzegovina: "05d8f4ef-45eb-463d-b2f3-8a5a613ee6b9",
      british_virgin_islands: "b02c6d20-83a2-4947-8a7d-91d1f9c4d8a2",
      central_african_republic: "61a4c4a4-25c2-4459-a874-ec1d24f8323a",
    },
  };

  return {
    ...data,
    cursor,
    lastRunDateTime,
  };
});
fn(({ identifiers, formMaps, ...state }) => {
  state.genderOptions = {
    male: "M",
    female: "F",
    unknown: "U",
    transgender_female: "O",
    transgender_male: "O",
    prefer_not_to_answer: "O",
    gender_variant_non_conforming: "O",
  };
  state.orgUnit = identifiers.find((i) => i.type === "ORG_UNIT")?.[
    "dhis2 attribute id"
  ];
  state.program = identifiers.find((i) => i.type === "PROGRAM")?.[
    "dhis2 attribute id"
  ];

  state.patientAttributes = Object.entries(formMaps.patient.dataValueMap)
    .filter(
      ([key]) =>
        !["qptKDiv9uPl", "fa7uwpCKIwa", "Jt9BhFZkvP2", "WDp4nVor9Z7"].includes(
          key
        )
    )
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

  state.dhis2PatientNumber = identifiers.find(
    (i) => i.type === "DHIS2_PATIENT_NUMBER"
  )?.["omrs identifierType"]; //DHIS2 ID or DHIS2 Patient Number

  state.dhis2PatientNumberAttributeId = identifiers.find(
    (i) => i.type === "DHIS2_PATIENT_NUMBER"
  )?.["dhis2 attribute id"]; //DHIS2 ID or DHIS2 Patient Number

  state.openmrsAutoId = identifiers.find((i) => i.type === "OPENMRS_AUTO_ID")?.[
    "omrs identifierType"
  ]; //MSF ID or OpenMRS Patient Number

  state.openmrsAutoIdAttributeId = identifiers.find(
    (i) => i.type === "OPENMRS_AUTO_ID"
  )?.["dhis2 attribute id"]; //MSF ID or OpenMRS Patient Number

  return state;
});
