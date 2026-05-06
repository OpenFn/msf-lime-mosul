// Check out the Job Writing Guide for help getting started:
// https://docs.openfn.org/documentation/jobs/job-writing-guide
// Cleanup: remove all collections data
collections.remove('mosul-metadata-mappings-main', '*');

collections.set('mosul-metadata-mappings-main', 'syncedAt', $.syncedAt);
collections.set('mosul-metadata-mappings-main', 'sourceFile', $.sourceFile);
collections.set(
  'mosul-metadata-mappings-main',
  'formMetadata',
  $.formMetadata
);
collections.set(
  'mosul-metadata-mappings-main',
  'fileDateModified',
  $.fileDateModified
);

collections.set(
  'mosul-metadata-mappings-main',
  'optionSetKey',
  $.optionSetKey
);

collections.set('mosul-metadata-mappings-main', 'formMaps', $.formMaps);

collections.set(
  'mosul-metadata-mappings-main',
  'placeOflivingMap',
  $.placeOflivingMap
);

let itemCount = 0;
collections.set(
  'mosul-metadata-mappings-main',
  i => `optsMap-value-${++itemCount}`,
  $.optsMap
);

itemCount = 0;
collections.set(
  'mosul-metadata-mappings-main',
  i => `identifiers-value-${++itemCount}`,
  $.identifiers
);
