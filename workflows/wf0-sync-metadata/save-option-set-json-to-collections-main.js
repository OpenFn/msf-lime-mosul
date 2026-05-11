// Check out the Job Writing Guide for help getting started:
// https://docs.openfn.org/documentation/jobs/job-writing-guide
// Cleanup: remove all collections data
collections.remove('mosul-metadata-mappings', '*');

collections.set('mosul-metadata-mappings', 'syncedAt', $.syncedAt);
collections.set('mosul-metadata-mappings', 'sourceFile', $.sourceFile);
collections.set(
  'mosul-metadata-mappings',
  'formMetadata',
  $.formMetadata
);
collections.set(
  'mosul-metadata-mappings',
  'fileDateModified',
  $.fileDateModified
);

collections.set(
  'mosul-metadata-mappings',
  'optionSetKey',
  $.optionSetKey
);

collections.set('mosul-metadata-mappings', 'formMaps', $.formMaps);

collections.set(
  'mosul-metadata-mappings',
  'placeOflivingMap',
  $.placeOflivingMap
);

let itemCount = 0;
collections.set(
  'mosul-metadata-mappings',
  i => `optsMap-value-${++itemCount}`,
  $.optsMap
);

itemCount = 0;
collections.set(
  'mosul-metadata-mappings',
  i => `identifiers-value-${++itemCount}`,
  $.identifiers
);
