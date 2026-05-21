export const genSheets = (sourceFile) => {
  const todayDate = new Date().toISOString().split("T")[0];

  const shortFile = sourceFile
    .split("LIME EMR - Iraq Metadata - Release 1 -")[1]
    .replace(/\s+/g, "")
    .toLowerCase();
  const sheetAffix = `${shortFile}:runDate:${todayDate}`;
  return [`WarningErrors:${sheetAffix}`, `FailingErrors:${sheetAffix}`];
};
