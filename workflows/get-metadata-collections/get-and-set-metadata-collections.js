// Check out the Job Writing Guide for help getting started:
// https://docs.openfn.org/documentation/jobs/job-writing-guide

// collections.remove("metadata-mappings", "mappings-*")

//  collections.remove("metadata-mappings", "mapping*")

 collections.get("metadata_mappings", "mappingSets") // getting collections from metadata project

 collections.set("mosul-metadata-mappings", "mappingSets", state => {
  return state.data
 })

collections.get("mosul-metadata-mappings", "mappingSets") 
