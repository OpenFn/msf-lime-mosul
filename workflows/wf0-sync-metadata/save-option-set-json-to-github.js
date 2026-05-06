const metadataPath =
  'repos/OpenFn/msf-lime-metadata/contents/metadata/collections.json';

get(metadataPath, {
  headers: {
    'user-agent': 'OpenFn',
  },
  query: {
    ref: 'collections',
  },
});

fn(state => {
  const {
    sourceFile,
    fileDateModified,
    syncedAt,
    formMaps,
    formMetadata,
    optsMap,
    data,
    identifiers,
    optionSetKey,
    placeOflivingMap,
  } = state;

  state.body = {
    message: 'Update metadata content',
    committer: {
      name: 'Emmanuel Evance',
      email: 'mtuchidev@gmail.com',
    },
    content: util.encode(
      JSON.stringify({
        sourceFile,
        fileDateModified,
        syncedAt,
        optionSetKey,
        optsMap,
        formMaps,
        identifiers,
        formMetadata,
        placeOflivingMap,
      })
    ),
    sha: data.sha,
    branch: 'collections',
  };

  return state;
});

put(
  metadataPath,
  {
    body: $.body,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'user-agent': 'OpenFn',
    },
  },
  ({ body, data, references, response, ...state }) => state
);
