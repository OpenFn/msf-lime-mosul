// Cleanup: remove all collections data
collections.remove('mosul-metadata-mappings-staging', '*');

collections.set('mosul-metadata-mappings-staging', 'syncedAt', $.syncedAt);
collections.set('mosul-metadata-mappings-staging', 'sourceFile', $.sourceFile);
collections.set(
  'mosul-metadata-mappings-staging',
  'formMetadata',
  $.formMetadata
);
collections.set(
  'mosul-metadata-mappings-staging',
  'fileDateModified',
  $.fileDateModified
);

collections.set(
  'mosul-metadata-mappings-staging',
  'optionSetKey',
  $.optionSetKey
);

collections.set('mosul-metadata-mappings-staging', 'formMaps', $.formMaps);

collections.set(
  'mosul-metadata-mappings-staging',
  'placeOflivingMap',
  $.placeOflivingMap
);

let itemCount = 0;
collections.set(
  'mosul-metadata-mappings-staging',
  i => `optsMap-value-${++itemCount}`,
  $.optsMap
);

itemCount = 0;
collections.set(
  'mosul-metadata-mappings-staging',
  i => `identifiers-value-${++itemCount}`,
  $.identifiers
);
