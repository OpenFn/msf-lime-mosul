export default function mapF11(encounter, optsMap) {
  if (encounter.form.name.includes("F11-Family Planning Assessment")) {
    const answers = encounter.obs.filter(
      (o) => o.concept.uuid === "30b2d692-6a05-401f-8ede-13e027b8a436"
    );

    console.log({ answers });
    const mappingConfig = [
      { dataElement: "DYTLOoEKRas", index: 0 },
      { dataElement: "ddTrzQtQUGz", index: 1 },
      { dataElement: "fuNs3Uzspsm", index: 2 },
    ];

    return mappingConfig.map((config) => {
      if (answers[config.index]) {
        return {
          _dataElementName: answers[config.index].display,
          _omrs_uuid: answers[config.index].uuid,
          // _optSet: optsMap.find(
          //   (o) =>
          //     o["value.display - Answers"] ===
          //     answers[config.index]?.value?.display
          // ),
          dataElement: config.dataElement,
          value: optsMap.find(
            (o) =>
              o["value.display - Answers"] ===
              answers[config.index]?.value?.display
          )?.["DHIS2 Option Code"],
        };
      }
    });
  }
}
