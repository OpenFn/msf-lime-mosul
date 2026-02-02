const filterObsByConcept = (encounter, conceptUuid) => {
  const [conceptId, questionId] = conceptUuid.split("-rfe-");
  const answers = encounter.obs.filter(
    (o) =>
      o.concept.uuid === conceptId &&
      (questionId ? o.formFieldPath === `rfe-${questionId}` : true)
  );
  return answers;
};

export default function f22(encounter) {
  const answers = filterObsByConcept(
    encounter,
    "38d5dcf5-b8bf-420e-bb14-a270e1f518b3"
  ).map((o) => o.value.display);

  if (answers.length === 0) {
    return;
  }
  // Define mapping configurations
  const mappingConfig = [
    { dataElement: "y5EEruMtgG1", has: "None" },
    { dataElement: "SqCZBLTRSt7", has: "Ventilation" },
    { dataElement: "hW2US5pqO9c", has: "Cardiac massage" },
    { dataElement: "ZgzXA4TjsDg", has: "Adrenaline" },
    { dataElement: "BYxj9JiIETF", has: "Other" },
  ];

  return mappingConfig
    .map((config) => {
      if (answers.some((a) => a.includes(config.has))) {
        return {
          dataElement: config.dataElement,
          value: true,
        };
      }
    })
    .filter(Boolean);
}
