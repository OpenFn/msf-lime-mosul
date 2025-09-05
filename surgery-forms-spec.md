### Context

New Surgery Program forms have been added in OpenMRS. The current
`wf2-omr-dhis2` workflow was designed to handle existing programs (Mental
Health, Family Planning). We need to modify the workflow to accommodate the
F16-Operative report, F17-Surgery admission form, and F18-Surgery discharge
form.

### Specific Request

Update `wf2-omrs-dhis` workflow to include F16-Operative report, F17-Surgery and
F18-Surgery discharge form mapping

- branch off from `staging`: `git checkout -b [136-new-forms]`
- project: [wf2-omrs-dhis2-136](URL) // TODO: update url
- toggl: `MSF Support 2025 (From 16th of June '25)`

- Collections: `wf2-orm-dhis2` workflow use `mosul-metadata-mappings-staging`
  collection. // TODO: link to step
- Mapping Specs:

  - [F16-form](https://docs.google.com/spreadsheets/d/1QDqguCUHs1AJVb8wxLQtgRA2rnkjCDQa/edit?gid=1196569674#gid=1196569674),
  - [F17-form](https://docs.google.com/spreadsheets/d/1QDqguCUHs1AJVb8wxLQtgRA2rnkjCDQa/edit?gid=1536056139#gid=1536056139)
  - [F18-form](https://docs.google.com/spreadsheets/d/1QDqguCUHs1AJVb8wxLQtgRA2rnkjCDQa/edit?gid=1205626716#gid=1205626716)

- Video Links: Ensure any video links are provided.
  - [How to create patient in OpenMRS](https://loom.com) // TODO: create loom
    video
  - [How to create encounters in OpenMRS](https://loom.com) // TODO: create loom
    video
  - [How to test DHIS2](https://loom.com) // TODO: create loom video

### Test Data

- Create F16, F17, F18 encounters for Patient `Test test MH`.
  [See how to create encounters]() //TODO: create loom video
- Trigger wf2-omrs-dhis2 workflow from `Get patients` steps and watch out the
  output of `Get Encounters` step. It should contain encounters for F16, F17 and
  F18

### Changes

#### In `Events Mapping` Step

- Add custom logic corresponding to Surgery forms as per mapping spec in tabs
  `F16-Operative report`, `F17-Surgery admission form`,
  `F18-Surgery discharge form`
- adaptor: [common@2.3.0](link to major version of 4.\* docs) // TODO: Double
  check
- input/testdata: [test-data](app.openfn.link) // TODO: Double check
- expected-output: Custom mapping logic for surgery forms with proper form
  pairing

// TODO: **More contenxt to be added about the each form custom logic....**

#### In `Create Events` Step

When `Get Encounters` run successfull, then `Create events` should run
successful. Troubleshoot any error that might be caused by the new mappings

- adaptor: [dhis2@5.0.1](link to major version docs)
- credentials: `LP: OPENFN DHIS2 UAT`, `FN: MSF DHIS2 UAT` // TODO: Double check

### Important

- [See how to create patient in OpenMRS]()
- [See how to create encounters]()
- [See adaptor registry cache for available versions]() // TODO add link

---

<details>
<summary>Pre-deployment Checklist (For consultants)</summary>

Before closing off this issue, ensure the following items are checked:

- [ ] **Run test suite**: For major releases that affect most parts of the
      workflow, run the entire test suite and ensure that it passes
- [ ] **Version-locking of Adaptors**: Ensure that each job is version locked to
      the adaptor versions that are specified in the
      [cache registry](https://github.com/MSF-OCG/LIME-EMR/blob/main/scripts/run_msf_addons.sh#L53).
- [ ] **Export Configuration**: Export both project.yaml (the project spec) and
      projectState and version the release
- [ ] **Modify documentations and diagram**: Consider if user guide, README
      docs, diagrams, and/or test suite need to be updated.
- [ ] **Submit for Review on MSF github repo:** Push changes to a GitHub branch
      and create a PR for MSF to review.

</details>
