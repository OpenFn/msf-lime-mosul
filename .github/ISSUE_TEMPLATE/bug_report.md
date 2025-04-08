---
name: Bug report
about: Create a report to help us improve
title: ''
labels: bug
assignees: ''
---

## Describe the bug and expected behavior

A clear and concise description of what the bug is. Include any error messages
from the run logs and the expected behavior.

## To Reproduce

Here is a [link to a failed run] on OpenFn.org which is indicative of the bug:

1. Using a initial input `{data: {"name": "John Doe"}}` or
   `{"lastSync": "2020-01-01T00:00:00.000Z"}`
2. Run [Name of step] or `step.js`
3. See failed logs

### Step(s) to be updated

- Provide a link to the job itself in GitHub.
- Mention the adaptor being used.
- Provide the state directly or link to a file.

  > ```json
  > {
  >   "configuration": ["SEE LAST PASS: 'client cred'"],
  >   "data": {LINK TO STATE},
  >   "cursor": "2020-01-19 00:00:00"
  > }
  > ```

- Redact any sensitive information and provide instructions for where it can be
  found.

## Testing Guidance

Link to test suite and/or provide examples of scenarios with sample input/output
data to help the dev validate the implementation.

## Toggl

`Name of Toggl project`

## Branch and Project

## Pre-Development Checklist

Before handling this issue to a developer, ensure the following items are
checked:

- [ ] Credentials: Ensure all necessary credentials are available and
      documented.
- [ ] Sample Input Data: Ensure sample input data is provided and linked.
- [ ] PII: Verify if any Personally Identifiable Information (PII) is involved
      and ensure proper handling.
- [ ] Collections: Confirm if collections are needed and pre-configure with
      sample data if required.
- [ ] Mapping Spec: Ensure mapping specifications are complete and linked.
- [ ] API Docs: Ensure all relevant API documentation is linked.
- [ ] Workflow Diagrams: Ensure workflow diagrams are complete and linked.
- [ ] VPN Access: Ensure VPN Access is provided if required to run the workflow
- [ ] Toggl: Ensure the Toggl project name is provided.

## Pre-deployment Checklist(For consultants)

Before closing off this issue, ensure the following items are checked:

- [ ] **Run test suite**: For major releases that affect most parts of the workflow, run the entire test suite and ensure that it passes
- [ ] **Version-locking of CLI**: Ensure that each job is version locked to the adaptor versions that are specified in the [cache registry](https://github.com/MSF-OCG/LIME-EMR/blob/main/scripts/run_msf_addons.sh#L53). 
- [ ] **Export Configuration**: Export both project.yaml (the project spec) and projectState. Version this release - check how github versioning with actions? works - have a chat with Mtuchi
- [ ] **Modify documentations and diagram**: For features that require documentation and diagram updates. Review test suite
- [ ] **Submit for Review on MSF github repo:** Push changes to a GitHub branch and create a PR  for MSF to review.
