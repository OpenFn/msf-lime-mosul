---
name: Feature request
about: For new workflows & change requests
title: ''
labels: feature request
assignees: ''
---

## Background, context, and business value

A clear and concise description of what the client wants and WHY.

For example: [Insert use case here]

## The specific request, in as few words as possible

A clear and concise description of what you want to happen.  
Things to include as needed:

- Workflow Diagram: [Link to workflow diagram]
- Mapping Specs: [Link to field-level mapping specifications]
- API Docs: [Link to relevant API & system documentation]

## Data Volumes & Limits

How many records do we think these jobs will need to process in each run? For
example:

```md
When you GET data from the DB, this may return up to 1000 records. There are no
known Primero API limits for # of records, but there is API paging to consider.
```

## [Workflow Name] Workflow Steps

Create a workflow in which OpenFn will:

### Trigger: Cron Schedule `Every 1 hour`

> What is the trigger type: cron, webhook, or kafka? Be sure to provide a sample
> input.

### Step 1: Get new rows from the PostgreSQL database every 1 hour

- **Adaptor:** [PostgreSQL]
- **Input**: [Link to sample input data]
- **Collections (optional):** [Collection details if required]
- **Credential (optional):** [Also specify If VPN Access is required]
- **Desired Output:** [Description of the desired output]

### Step 2: Clean & transform the data according to the specified mapping rules

- **Adaptor:** [Common]
- **Edge Condition**: [Eg: on success]
- **Mapping Spec**: [Link to mapping spec]
- **Credential (optional):** [Credential details if required]
- **Desired Output:** [Description of the desired output]

### Step 3: Upsert cases in the Primero case management system via externalId `case_id`

> Note: 1 DB row will = 1 case record.

- **Adaptor:** [Primero]
- **Edge Condition**: [Eg: `!state.errors && state.patients.length > 0`]
- **Credential (optional):** [Credential details if required]
- **Desired Output:** [Description of the desired output]

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
- [ ] **Version-locking of Adaptors**: Ensure that each job is version locked to the adaptor versions that are specified in the [cache registry](https://github.com/MSF-OCG/LIME-EMR/blob/main/scripts/run_msf_addons.sh#L53). 
- [ ] **Export Configuration**: Export both project.yaml (the project spec) and projectState and version the release
- [ ] **Modify documentations and diagram**: Consider if user guide, README docs, diagrams, and/or test suite need to be updated.
- [ ] **Submit for Review on MSF github repo:** Push changes to a GitHub branch and create a PR  for MSF to review.

