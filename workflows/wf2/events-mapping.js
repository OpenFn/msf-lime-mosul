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

    console.log(`matchingOption value: "${matchingOption}" for`);
    console.log({
      optionKey,
      conceptUid: answer.concept.uuid,
      'answer.value.uid': answer.value.uuid,
      'answer.value.display': answer.value.display,
      matchingOption,
      matchingOptionSet,
    });

    if (matchingOption === 'FALSE') {
      return 'false';
    }
    if (matchingOption === 'TRUE') {
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
          dataElement: 'pN4iQH4AEzk',
          value: findAnswerByConcept(
            encounter,
            '22809b19-54ca-4d88-8d26-9577637c184e'
          )
            ? true
            : false,
        });
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
          console.log({ f29Encounter });
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

          console.log({ previousChangeInDiagnosis });
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
      if (encounter.form.description.includes('F33-MHPSS Closure v2')) {
        const lastScore = encounter.obs.find(
          o => o.concept.uuid === '90b3d09c-d296-44d2-8292-8e04377fe027'
        )?.value;

        const filterOutScore = state.allEncounters.filter(
          e =>
            e.uuid !== encounter.uuid &&
            e.obs.find(o => o.concept.display === 'Mental Health Outcome Scale')
              ?.value !== 0
        );

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

        console.log({ firstScore, lastScore });
        customMapping.push({
          dataElement: 'b8bjS7ah8Qi',
          value: lastScore - firstScore,
        });
      }

      if (encounter.form.description.includes('F34-mhGAP Closure v2')) {
        console.log('Was called', encounter.form.description);
        const lastScore = encounter.obs.find(
          o => o.concept.uuid === '90b3d09c-d296-44d2-8292-8e04377fe027'
        )?.value;

        const filterOutScore = state.allEncounters.filter(
          e =>
            e.uuid !== encounter.uuid &&
            e.obs.find(o => o.concept.display === 'Mental Health Outcome Scale')
              ?.value !== 0
        );
        state.temStore = filterOutScore;
        // filterOutScore
        //   .sort((a, b) => {
        //     return (
        //       new Date(a.encounterDatetime) - new Date(b.encounterDatetime)
        //     );
        //   })
        //   .at(0);
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
        console.log({ firstScore });

        console.log({ firstScore, lastScore });
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
