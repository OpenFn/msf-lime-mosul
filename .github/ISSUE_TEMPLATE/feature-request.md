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
**Request Type:** New Workflow? Change Request?

A clear and concise description of what you want to happen.  
Things to include as needed:
- The number of workflows needed to be created or updated 
- The function of each workflow including specific resources and operations
- Unique identifiers 
- Links to mapping specifications, data flow diagrams, sample input/output data, and any API documentation
- Links to the data model of target systems, if available

```md
Create a workflow in which OpenFn will: 
1. Get new rows from the PostgreSQL database every 1 hour
2. Clean & transform the data according to the specified mapping rules, and then 
3. Upsert cases in the Primero case management system via externalId `case_id`
(Note: 1 DB row will = 1 case record.)

See [links] below for the workflow diagrams, mapping specs, & Primero data model.
```

## Data Volumes & Limits
How many records do we think these jobs will need to process in each run? For example: 
```md
When you GET data from the DB, this may return up to 1000 records. 
There are no known Primero API limits for # of records, but there is API paging to consider.
```

## Workflow Spec

For each new Workflow, describe the business process to be automated and its objectives. 

- **Workflow Diagram**: {add link to diagram describing each step & logic}
- **Mapping Specs**: {add link to field-level mapping specifications - in most cases you will have 1 spec per WF Step)
- **API Docs:** {add links to relevant API & system documentation}

### Trigger
What is the trigger type: cron, webhook, or kafka? Be sure to provide a sample input. 

### Adaptors
Which adaptor(s) do you expect to use? Any specific adaptor version considerations? 

### Collections
Do you plan to use `collections` feature in this workflow? If yes, please (1) specify how the collection should be used, and (2) make sure to either pre-configure the collection with sample data or spec how the collection data should be structured. 


## Input

### Credentials
Which credentials can be used to access the target system(s)? Do these target systems have test data? 
(Do NOT share credential secrets on this issue -> rather point to where it can be found).

### Sample Input Data
Describe how the "input" for this workflow will be generated (e.g., webhook request, timer-based query to be sent). Either provide an example directly, link to a file, or describe how a query can be executed to extract data. 

Be sure to redact any sensitive data and to not paste here. 


## Testing Guidance
Link to test suite and/or provide examples of scenarios with sample input/output data to help the dev validate the implementation. 

## Toggl
Name of Toggl project
