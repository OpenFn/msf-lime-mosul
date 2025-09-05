## Context

[Brief description of the project and what needs to be accomplished]

## Specific Request

Update workflow1 to include form F1, F2 and F3 form mapping

- branch: `git checkout -b [134-new-forms]`
- project: (wf2-mrs-dhis2)[URL]
- toggl: `OpenFn Support Contract`
- vpn: Yes (if required)
- PII: Verify if any Personally Identifiable Information (PII) is involved and
  ensure proper handling. (If mentioned in the project spec)
- Collections: Confirm if collections are needed and pre-configure with sample
  data if required. (If mentioned in the project spec)
- Mapping Spec: Ensure mapping specifications are complete and linked.
- API Docs: Ensure all relevant API documentation is linked.
- Workflow Diagrams: Ensure workflow diagrams are complete and linked.
- VPN Access: Ensure VPN Access is provided if required to run the workflow (If
  mentioned in the project spec)
- Toggl: Ensure the Toggl project name is provided. (required)
- Video Links: Ensure any video links are provided.
  - [Workflow Diagram Explanation](https://youtu.be/5-9-0-4-1-5)
  - [How to create patient in OpenMRS](https://youtu.be/5-9-0-4-1-5)
  - [How to test DHIS2](https://youtu.be/5-9-0-4-1-5)

<details><summary>Sample code/data</summary>
[Include relevant sample data or code snippets here]
</details>

## Changes

### In workflow->step1

- Change/Add: [Description of changes needed]
- [mapping-spec](URL)
- adaptor: [adaptor@version](link to adaptor docs) (important to version lock)
- credentials: `[Environment]: [Credential Name]` (If required)
- input/testdata: [link to test-data](app, GitHub Link)
- expected-output: [Description of expected output]
- api-docs/postman-link: [URL]

### In workflow->step2

- Change/Add: [Description of changes needed]
- adaptor: [adaptor@version](link to adaptor docs) (important to version lock)
- credentials: `[Environment]: [Credential Name]`
- input/testdata: [link to test-data](app, GitHub Link)
- expected-output: [Description of expected output]
- api-docs/postman-link: [URL]

### In workflow->stepN

[Continue pattern for additional steps...]

## Testing

1. **Setup Test Data:**

   - Create [test data description] in [Source System]
   - Credentials: `[Environment]: [Credential Name]`
   - [Link to system](URL)

2. **Execute Workflow:**

   - Trigger workflow: [Method - cron/webhook/manual]
   - [Link to workflow](URL)

3. **Validate Results:**
   - Inspect step1 and step2 passed
   - Go to [Target System] Dashboard, verify expected output
   - Credentials: `[Environment]: [Credential Name]`
   - [Link to system](URL)

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
