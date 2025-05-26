const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

each(
  $.encounters,
  get(
    'tracker/trackedEntities',
    {
      orgUnit: $.orgUnit,
      program: $.program,
      filter: [`AYbfTPYMNJH:Eq:${$.data.patient.uuid}`],
      fields: '*,enrollments[*],enrollments[events[*]]',
    },
    {},
    async state => {
      const encounter = state.references.at(-1);
      console.log(encounter.patient.uuid, 'Encounter patient uuid');

      const { trackedEntity, enrollments } = state.data?.instances?.[0] || {};
      if (trackedEntity && enrollments) {
        state.TEIs ??= {};
        state.TEIs[encounter.patient.uuid] = {
          trackedEntity,
          events: enrollments[0]?.events,
          enrollment: enrollments[0]?.enrollment,
        };
      }

      await delay(2000);
      return state;
    }
  )
);

const processAnswer = (
  answer,
  conceptUuid,
  dataElement,
  optsMap,
  optionSetKey
) => {
  return typeof answer.value === 'object'
    ? processObjectAnswer(
        answer,
        conceptUuid,
        dataElement,
        optsMap,
        optionSetKey
      )
    : processOtherAnswer(answer, conceptUuid, dataElement);
};

const processObjectAnswer = (
  answer,
  conceptUuid,
  dataElement,
  optsMap,
  optionSetKey
) => {
  if (isDiagnosisByPsychologist(conceptUuid, dataElement)) {
    console.log('Yes done by psychologist..');
    return '' + answer.value.uuid === '278401ee-3d6f-4c65-9455-f1c16d0a7a98';
  }

  if (isTrueOnlyQuestion(conceptUuid, dataElement)) {
    console.log('True only question detected..', dataElement);
    return answer.value.uuid === '681cf0bc-5213-492a-8470-0a0b3cc324dd'
      ? 'true'
      : undefined;
  }

  return findMatchingOption(answer, optsMap, optionSetKey);
};

const processOtherAnswer = (answer, conceptUuid, dataElement) => {
  if (isPhq9Score(answer.value, conceptUuid, dataElement)) {
    console.log('isPhq9Score', isPhq9Score);
    return getRangePhq(answer.value);
  }
  return answer.value;
};

const processNoAnswer = (data, conceptUuid, dataElement) => {
  if (isEncounterDate(conceptUuid, dataElement)) {
    return data.encounterDatetime.replace('+0000', '');
  }
  return '';
};

const findMatchingOption = (answer, optsMap, optionSetKey) => {
  const optionKey = `${answer.formUuid}-${answer.concept.uuid}`;

  const matchingOptionSet = optionSetKey[optionKey];
  console.log('optionKey', optionKey);
  console.log('conceptUid', answer.concept.uuid);
  console.log('value uid', answer.value.uuid);
  console.log('value display', answer.value.display);
  console.log('matchingOptionSet', matchingOptionSet);

  const matchingOption =
    optsMap.find(
      o =>
        o['value.uuid - External ID'] === answer.value.uuid &&
        o['DHIS2 Option Set UID'] === matchingOptionSet
    )?.['DHIS2 Option Code'] || answer.value.display; //TODO: revisit this logic if optionSet not found

  console.log('matchingOption value', matchingOption);

  if (matchingOption === 'FALSE') {
    return 'false';
  }
  if (matchingOption === 'TRUE') {
    return 'true';
  }

  return matchingOption || '';
};

const isEncounterDate = (conceptUuid, dataElement) => {
  return (
    conceptUuid === 'encounter-date' &&
    ['CXS4qAJH2qD', 'I7phgLmRWQq', 'yUT7HyjWurN'].includes(dataElement)
  );
};

const isTrueOnlyQuestion = (conceptUuid, dataElement) =>
  conceptUuid === '54e8c1b6-6397-4822-89a4-cf81fbc68ce9' &&
  dataElement === 'G0hLyxqgcO7';

const isDiagnosisByPsychologist = (conceptUuid, dataElement) =>
  conceptUuid === '722dd83a-c1cf-48ad-ac99-45ac131ccc96' &&
  dataElement === 'pN4iQH4AEzk';

const isPhq9Score = (value, conceptUuid, dataElement) =>
  typeof value === 'number' &&
  (conceptUuid === '5f3d618e-5c89-43bd-8c79-07e4e98c2f23' ||
    conceptUuid === '6545b874-f44d-4d18-9ab1-7a8bb21c0a15');

const getRangePhq = input => {
  if (input >= 20) return '>20';
  if (input >= 15) return '15_19';
  if (input >= 10) return '10_14';
  if (input >= 5) return '5_9';
  return '0_4';
};

const dataValuesMapping = (data, dataValueMap, optsMap, optionSetKey) => {
  return Object.keys(dataValueMap)
    .map(dataElement => {
      const conceptUuid = dataValueMap[dataElement];
      const obsAnswer = data.obs.find(o => o.concept.uuid === conceptUuid);
      const answer = {
        ...obsAnswer,
        formUuid: data.form.uuid,
      };
      const value = answer
        ? processAnswer(answer, conceptUuid, dataElement, optsMap, optionSetKey)
        : processNoAnswer(data, conceptUuid, dataElement);

      return { dataElement, value };
    })
    .filter(d => d);
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

  const processEncounter = (data, state) => {
    const form = state.formMaps[data.form.uuid];
    if (!form?.dataValueMap) {
      return null;
    }
    const { trackedEntity, enrollment, events } =
      state.TEIs[data.patient.uuid] || {};

    if (!trackedEntity || !enrollment) {
      handleMissingRecord(data, state);
      return null;
    }

    return {
      event: events.find(e => e.programStage === form.programStage)?.event,
      program: state.program,
      orgUnit: state.orgUnit,
      trackedEntity,
      enrollment,
      occurredAt: data.encounterDatetime.replace('+0000', ''),
      programStage: form.programStage,
      dataValues: dataValuesMapping(
        data,
        form.dataValueMap,
        state.optsMap,
        state.optionSetKey
      ),
    };
  };

  state.encountersMapping = state.encounters
    .map(data => processEncounter(data, state))
    .filter(Boolean);

  return state;
});
