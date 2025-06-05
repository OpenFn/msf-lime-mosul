const getRangePhq = input => {
  if (input >= 20) return '>20';
  if (input >= 15) return '15_19';
  if (input >= 10) return '10_14';
  if (input >= 5) return '5_9';
  return '0_4';
};
const processAnswer = (
  answer,
  conceptUuid,
  dataElement,
  optsMap,
  optionSetKey
) => {
  if (typeof answer.value === 'object') {
    const isDiagnosisByPsychologist =
      conceptUuid === '722dd83a-c1cf-48ad-ac99-45ac131ccc96' &&
      dataElement === 'pN4iQH4AEzk';
    if (isDiagnosisByPsychologist) {
      console.log('Yes done by psychologist..');
      return '' + answer.value.uuid === '278401ee-3d6f-4c65-9455-f1c16d0a7a98';
    }

    const isTrueOnlyQuestion =
      conceptUuid === '54e8c1b6-6397-4822-89a4-cf81fbc68ce9' &&
      dataElement === 'G0hLyxqgcO7';

    if (isTrueOnlyQuestion) {
      console.log('True only question detected..', dataElement);
      return answer.value.uuid === '681cf0bc-5213-492a-8470-0a0b3cc324dd'
        ? 'true'
        : undefined;
    }

    const optionKey = `${answer.formUuid}-${answer.concept.uuid}`;
    const matchingOptionSet = optionSetKey[optionKey];
    const opt = optsMap.find(
      o =>
        o['value.uuid - External ID'] === answer.value.uuid &&
        o['DHIS2 Option Set UID'] === matchingOptionSet
    );
    const matchingOption =
      opt?.['DHIS2 Option Code'] ||
      opt?.['DHIS2 Option name'] || // TODO: Sync with AK: We have added this because  Opticon Code is empty in some cases.
      answer?.value?.display; //TODO: revisit this logic if optionSet not found

    // console.log(`matchingOption value: "${matchingOption}" for`);
    // console.log({
    //   optionKey,
    //   conceptUid: answer.concept.uuid,
    //   'answer.value.uid': answer.value.uuid,
    //   'answer.value.display': answer.value.display,
    //   matchingOption,
    //   matchingOptionSet,
    // });

    if (matchingOption === 'FALSE' || matchingOption === 'No') {
      return 'false';
    }
    if (matchingOption === 'TRUE' || matchingOption === 'Yes') {
      return 'true';
    }

    return matchingOption || '';
  }

  const PHQ9_CONCEPT_UUIDS = [
    '5f3d618e-5c89-43bd-8c79-07e4e98c2f23',
    '6545b874-f44d-4d18-9ab1-7a8bb21c0a15',
  ];
  const isPhq9Score =
    typeof answer.value === 'number' &&
    PHQ9_CONCEPT_UUIDS.includes(conceptUuid);
  if (isPhq9Score) {
    return getRangePhq(answer.value);
  }
  return answer.value;
};

const processNoAnswer = (encounter, conceptUuid, dataElement) => {
  const isEncounterDate =
    conceptUuid === 'encounter-date' &&
    ['CXS4qAJH2qD', 'I7phgLmRWQq', 'yUT7HyjWurN', 'EOFi7nk2vNM'].includes(
      dataElement
    );
  // These are data elements for encounter date in DHIS2
  // F29 MHPSS Baseline v2, F31-mhGAP Baseline v2, F30-MHPSS Follow-up v2, F32-mhGAp Follow-up v2

  if (isEncounterDate) {
    return encounter.encounterDatetime.replace('+0000', '');
  }
  return '';
};

const findAnswerByConcept = (encounter, conceptUuid) => {
  const answer = encounter.obs.find(o => o.concept.uuid === conceptUuid);
  return answer?.value?.display;
};

// Helper functions for finding observations
const findObsByConcept = (encounter, conceptUuid) =>
  encounter.obs.find(o => o.concept.uuid === conceptUuid);

// Concept UUIDs
const CONCEPTS = {
  BASELINE_CONCEPT: '22809b19-54ca-4d88-8d26-9577637c184e',
  PRIORITY_1: '45b39cbf-0fb2-4682-8544-8aaf3e07a744',
  PRIORITY_2: 'ee1b7973-e931-494e-a9cb-22b814b4d8ed',
  PRIORITY_3: '92a92f62-3ff6-4944-9ea9-a7af23949bad',
  OTHER_SPECIFY: 'e08d532b-e56c-43dc-b831-af705654d2dc',
  PRECIPITATING_EVENT_1: 'd5e3d927-f7ce-4fdd-ac4e-6ad0b510b608',
  PRECIPITATING_EVENT_2: '54a9b20e-bce5-4d4a-8c9c-e0248a182586',
  PRECIPITATING_EVENT_3: 'e0d4e006-85b5-41cb-8a21-e013b1978b8b',
  PRECIPITATING_EVENT_OTHER: '790b41ce-e1e7-11e8-b02f-0242ac130002',
};

// DHIS2 Data Elements
const DATA_ELEMENTS = {
  BASELINE: 'pN4iQH4AEzk',
  PRIORITY_1_OTHER: 'pj5hIE6iyAR',
  PRIORITY_2_OTHER: 'Em5zvpdd5ha',
  PRIORITY_3_OTHER: 'aWsxYkJR8Ua',
  PRECIPITATING_EVENT_1_OTHER: 'm8qis4iUOTo',
  PRECIPITATING_EVENT_2_OTHER: 'mNK6CITsdWD',
  PRECIPITATING_EVENT_3_OTHER: 'jocqmYW394G',
};

// Prepare DHIS2 data model for create events
fn(state => {
  const handleMissingRecord = (data, state) => {
    const { uuid, display } = data.patient;

    console.log(uuid, 'Patient is missing trackedEntity && enrollment');

    state.missingRecords ??= {};
    state.missingRecords[uuid] ??= {
      encounters: [],
      patient: display,
    };

    state.missingRecords[uuid].encounters.push(data.uuid);
  };

  state.eventsMapping = state.encounters
    .map(encounter => {
      const form = state.formMaps[encounter.form.uuid];
      if (!form?.dataValueMap) {
        return null;
      }
      const { trackedEntity, enrollment, events } =
        state.TEIs[encounter.patient.uuid] || {};

      if (!trackedEntity || !enrollment) {
        handleMissingRecord(encounter, state);
        return null;
      }
      const formDataValues = Object.keys(form.dataValueMap)
        .map(dataElement => {
          const conceptUuid = form.dataValueMap[dataElement];
          const obsAnswer = encounter.obs.find(
            o => o.concept.uuid === conceptUuid
          );
          const answer = {
            ...obsAnswer,
            formUuid: encounter.form.uuid,
          };
          const value = answer
            ? processAnswer(
                answer,
                conceptUuid,
                dataElement,
                state.optsMap,
                state.optionSetKey
              )
            : processNoAnswer(encounter, conceptUuid, dataElement);

          return { dataElement, value };
        })
        .filter(d => d);

      const customMapping = [];

      if (encounter.form.description.includes('F29-MHPSS Baseline v2')) {
        customMapping.push({
          dataElement: DATA_ELEMENTS.BASELINE,
          value: findAnswerByConcept(encounter, CONCEPTS.BASELINE_CONCEPT)
            ? true
            : false,
        });

        const priority1 = findObsByConcept(encounter, CONCEPTS.PRIORITY_1);
        if (priority1 && priority1?.value?.display === 'Other') {
          customMapping.push({
            dataElement: DATA_ELEMENTS.PRIORITY_1_OTHER,
            value: findObsByConcept(encounter, CONCEPTS.OTHER_SPECIFY).value,
          });
        }

        const priority2 = findObsByConcept(encounter, CONCEPTS.PRIORITY_2);
        if (priority2 && priority2?.value?.display === 'Other') {
          customMapping.push({
            dataElement: DATA_ELEMENTS.PRIORITY_2_OTHER,
            value: findObsByConcept(encounter, CONCEPTS.OTHER_SPECIFY).value,
          });
        }

        const priority3 = findObsByConcept(encounter, CONCEPTS.PRIORITY_3);
        if (priority3 && priority3?.value?.display === 'Other') {
          customMapping.push({
            dataElement: DATA_ELEMENTS.PRIORITY_3_OTHER,
            value: findObsByConcept(encounter, CONCEPTS.OTHER_SPECIFY).value,
          });
        }

        const precipitatingEvent1 = findObsByConcept(
          encounter,
          CONCEPTS.PRECIPITATING_EVENT_1
        );
        const otherValue = encounter.obs.find(o =>
          o.display.includes('Other')
        )?.value;

        if (
          precipitatingEvent1 &&
          precipitatingEvent1?.value?.uuid === otherValue?.uuid
        ) {
          customMapping.push({
            dataElement: DATA_ELEMENTS.PRECIPITATING_EVENT_1_OTHER,
            value: otherValue.display,
          });
        }

        const precipitatingEvent2 = findObsByConcept(
          encounter,
          CONCEPTS.PRECIPITATING_EVENT_2
        );

        if (
          precipitatingEvent2 &&
          precipitatingEvent2?.value?.uuid === otherValue?.uuid
        ) {
          customMapping.push({
            dataElement: DATA_ELEMENTS.PRECIPITATING_EVENT_2_OTHER,
            value: otherValue.display,
          });
        }

        const precipitatingEvent3 = findObsByConcept(
          encounter,
          CONCEPTS.PRECIPITATING_EVENT_3
        );

        if (
          precipitatingEvent3 &&
          precipitatingEvent3?.value?.uuid === otherValue?.uuid
        ) {
          customMapping.push({
            dataElement: DATA_ELEMENTS.PRECIPITATING_EVENT_3_OTHER,
            value: otherValue.display,
          });
        }
      }

      if (encounter.form.description.includes('F30-MHPSS Follow-up v2')) {
        const missedSession = encounter => {
          if (
            encounter.obs.find(
              o => o.concept.uuid === '54e8c1b6-6397-4822-89a4-cf81fbc68ce9'
            )?.value?.display === 'Yes'
          ) {
            return encounter.encounterDatetime.replace('+0000', '');
          }
          const lastFollowupEncounter = state.allEncounters.find(e => {
            e.form.description.includes('F30-MHPSS Follow-up v2') &&
              e.obs.find(
                o => o.concept.uuid === '54e8c1b6-6397-4822-89a4-cf81fbc68ce9'
              )?.value?.display === 'Yes';
          });

          if (lastFollowupEncounter) {
            return lastFollowupEncounter.encounterDatetime.replace('+0000', '');
          }

          const f29Encounter = state.allEncounters.find(e =>
            e.form.description.includes('F29-MHPSS Baseline v2')
          );
          if (f29Encounter) {
            return f29Encounter.encounterDatetime.replace('+0000', '');
          }
        };
        const mapping = [
          {
            dataElement: 'jtKIoKducvE',
            value: missedSession(encounter),
          },
        ];
        customMapping.push(...mapping);
      }
      if (encounter.form.description.includes('F32-mhGAP Follow-up v2')) {
        const missedSession = encounter => {
          if (
            encounter.obs.find(
              o => o.concept.uuid === '54e8c1b6-6397-4822-89a4-cf81fbc68ce9'
            )?.value?.display === 'Yes'
          ) {
            return encounter.encounterDatetime.replace('+0000', '');
          }
          const lastFollowupEncounter = state.allEncounters.find(e => {
            e.form.description.includes('F32-mhGAP Follow-up v2') &&
              e.obs.find(
                o => o.concept.uuid === '54e8c1b6-6397-4822-89a4-cf81fbc68ce9'
              )?.value?.display === 'Yes';
          });

          if (lastFollowupEncounter) {
            return lastFollowupEncounter.encounterDatetime.replace('+0000', '');
          }

          const f29Encounter = state.allEncounters.find(e =>
            e.form.description.includes('F31-mhGAP Baseline v2')
          );

          if (f29Encounter) {
            return f29Encounter.encounterDatetime.replace('+0000', '');
          }
        };
        const changeInDiagnosis = encounter => {
          const patientUuid = encounter.patient.uuid;
          const previousChangeInDiagnosis = state.allEncounters
            .find(
              e =>
                e.patient.uuid === patientUuid &&
                e.form.description.includes('F32-mhGAP Follow-up v2') &&
                encounter.uuid !== e.uuid
            )
            ?.obs.find(
              o => o.concept.uuid === '22809b19-54ca-4d88-8d26-9577637c184e'
            )?.value?.display;

          const currentChangeInDiagnosis = encounter.obs.find(
            o => o.concept.uuid === '22809b19-54ca-4d88-8d26-9577637c184e'
          )?.value?.display;

          if (
            previousChangeInDiagnosis &&
            previousChangeInDiagnosis !== currentChangeInDiagnosis
          ) {
            return true;
          }

          return false;
        };
        const mapping = [
          {
            dataElement: 'fMqEZpiRVZV',
            value: missedSession(encounter),
          },
          {
            dataElement: 'XBVRRpgkEvE',
            value: changeInDiagnosis(encounter),
          },
        ];
        customMapping.push(...mapping);
      }
      if (
        encounter.form.description.includes('F33-MHPSS Closure v2') ||
        encounter.form.description.includes('F34-mhGAP Closure v2')
      ) {
        const lastScore = encounter.obs.find(
          o => o.concept.uuid === '90b3d09c-d296-44d2-8292-8e04377fe027'
        )?.value;

        const filterOutScore = state.allEncounters.filter(e => {
          const obs = e.obs.find(
            o => o.concept.display === 'Mental Health Outcome Scale'
          );
          return e.uuid !== encounter.uuid && obs && obs?.value !== 0;
        });

        const firstScore = filterOutScore
          .sort((a, b) => {
            return (
              new Date(a.encounterDatetime) - new Date(b.encounterDatetime)
            );
          })
          .at(0)
          ?.obs.find(
            o => o.concept.display === 'Mental Health Outcome Scale'
          )?.value;

        customMapping.push({
          dataElement: 'b8bjS7ah8Qi',
          value: lastScore - firstScore,
        });
      }

      return {
        event: events.find(e => e.programStage === form.programStage)?.event,
        program: state.program,
        orgUnit: state.orgUnit,
        trackedEntity,
        enrollment,
        occurredAt: encounter.encounterDatetime.replace('+0000', ''),
        programStage: form.programStage,
        dataValues: [...formDataValues, ...customMapping],
      };
    })
    .filter(Boolean);

  return state;
});
