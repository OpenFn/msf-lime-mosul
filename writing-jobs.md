## Core Concepts

### What is an OpenFn Job?

A Job performs a specific task like fetching data from Salesforce, converting
JSON to FHIR standard, or uploading data to a database.

Each job uses exactly ONE adaptor (connector) that provides helper functions
(Operations) for communicating with data sources.

A job is a single step in a workflow - a series of steps which perform some high
level business task, like synchronising patient data or aggregating form
submissions or automating business processes.

### JavaScript DSL

Jobs are written in a JavaScript-like Domain Specific Language (DSL). While it
looks and feels like regular JavaScript, there are some important differences:

#### Similarities to JavaScript

- Uses standard JavaScript syntax and features (variables, functions, objects,
  etc.)
- Supports modern JavaScript patterns like arrow functions, destructuring, etc.
- Can use most of standard JavaScript built-ins (e.g., `console.log()`). Note:
  some features are not supported(e.g., `eval`). See full list here
  (docs-link)//TODO

#### Key Differences

- Operations (like `get()`, `post()`, `each()`) are special functions that
  manage state and async behavior
- Operations must be called at the top level - they can't be nested inside other
  functions
- The `$` symbol is a special operator for accessing state (not a jQuery-like
  library)
- All asynchronous behavior must be handled through Operations, not Promises or
  async/await
- Job execution is sequential - each Operation completes before the next begins

For example, this looks like regular JavaScript but works differently:

```javascript
// This looks like regular JavaScript Promise chaining
// but is actually using OpenFn's special Operation chaining
get("/data")
  .then((state) => {
    console.log(state.data);
    return state;
  })
  .catch((error) => {
    console.log("Failed:", error);
  });

// This looks like array iteration but is a special Operation
each("$.data[*]", (state) => {
  // This callback transforms state but doesn't control the iteration
  return state;
});

// Error handling with .catch()
get("patients").catch((error, state) => {
  state.error = error;
  console.log("Error occurred:", error);
  return state; // Continue execution
  // OR
  throw error; // Stop execution
});

// Repeated operations using each()
each(
  $.items,
  post(`patient/${$.data.id}`, $.data).then((state) => {
    state.completed ??= [];
    state.completed.push(state.data);
    return state;
  })
);
```

### State and Operations

- Jobs take an input JavaScript object called **State** and execute
  **Operations** in series
- Operations transform state sequentially - the output of one becomes the input
  of the next
- The final state object is returned as output

### Critical Rules for Job Writing

#### 1. Operations Must Be at Top Level

Operations ONLY work at the top level of job code. Never nest operations inside
callbacks.

**✅ CORRECT:**

```javascript
get("/patients");
each("$.data.patients[*]", (state) => {
  item.id = `item-${index}`;
  return state;
});
post("/patients", dataValue("patients"));
```

**❌ WRONG:**

```javascript
get("/patients", {}, (state) => {
  // This will fail - nested operation!
  each("$.data.patients[*]", (item, index) => {
    item.id = `item-${index}`;
  });
});
```

#### 2. Always Return State from Callbacks

Callbacks must ALWAYS return the state object.

**✅ CORRECT:**

```javascript
fn((state) => {
  state.transformed = state.data.map((item) => ({ ...item }));
  return state; // Critical!
});
```

**❌ WRONG:**

```javascript
fn((state) => {
  state.transformed = state.data.map((item) => ({ ...item }));
  // Missing return!
});
```

#### 3. Reading State Lazily

Use the Lazy State Operator `$` or arrow functions to read state values at the
correct time.

**✅ CORRECT:**

```javascript
get("/some-data");
post("/upload", $.data); // Using $ operator
// OR
post("/upload", (state) => state.data); // Using arrow function
```

**❌ WRONG:**

```javascript
get("/some-data");
post("/upload", state.data); // Will be undefined!
```

## The Lazy State Operator ($)

The `$` operator is syntactic sugar for `(state) => state`. It ensures values
are resolved at runtime, not load-time.

### Usage Examples:

```javascript
// Basic usage
upsert("patient", $.data.patients[0]);

// Inside objects
create("agent", {
  name: $.patient.name,
  country: $.patient.country,
});

// String templates
get(`/patients/${$.patient.id}`);

// Expressions
create({
  profit: $.report.revenue - $.report.expenses,
});

// With mapping
each($.data.patients, post(`patients/${$.data.id}`, $.data));
```

### Important: $ is NOT state

- Cannot assign to `$`
- Cannot use outside operation arguments
- Can only READ from state, never WRITE

**❌ These are ERRORS:**

```javascript
const url = $.data.url; // Wrong
$.data.x = 10; // Wrong
fn((state) => {
  $.data.x = 10; // Wrong
});
```

## Common Patterns

### 1. Initializing Variables

```javascript
fn((state) => {
  state.results = [];
  state.lookup = {};
  state.keyMap = { AccountName: "C__Acc_Name" };
  state.maxPageSize = 200;
  state.convertToSF = (item) => {
    /* transform logic */
  };
  return state;
});

// Rest of job code...
```

### 2. Mapping Objects

```javascript
// Fetch data
get("https://system-a.com/api/patients/123");

// Transform inline
post("https://system-b.com/api/records/123", (state) => ({
  id: state.data.id,
  name: `${state.data.first_name} ${state.data.last_name}`,
  metadata: state.data.user_data,
}));
```

### 3. Iteration with each()

```javascript
// Transform each item
each(
  "$.data.patients[*]",
  upsert("Person__c", "Participant_PID__c", (state) => ({
    Participant_PID__c: state.data.pid,
    First_Name__c: state.data.participant_first_name,
    Surname__c: state.data.participant_surname,
  }))
);
```

### 4. Using Cursors

```javascript
// Set cursor
cursor("2024-04-08T12:00:00.0000");
// OR
cursor((state) => state.cursor, { defaultValue: "today" });

// Use cursor in queries
get((state) => `/registrations?since=${state.cursor}`);

// Update cursor
cursor("now");
```

### 5. Promise-like Operations (.then() and .catch())

OpenFn Operations provide `.then()` and `.catch()` methods to handle successful
results and errors in your job execution. These special Operation methods works
at the top level only.

#### .then()

Use `.then()` to handle successful Operation results:

```javascript
get("/api/data")
  .then((state) => {
    // Transform or process the response
    state.processedData = processData(state.data);
    return state;
  })
  .then((state) => {
    // Chain multiple transformations
    console.log("Processed:", state.processedData);
    return state;
  });
```

#### .catch()

Use `.catch()` to handle errors:

```javascript
get("/api/data")
  .then((state) => {
    // Transform or process the response
    state.processedData = processData(state.data);
    return state;
  })
  .catch((error) => {
    // Handle errors
    console.log("Error:", error);
    return state; // Continue execution
    // OR
    throw error; // Stop execution
  });
```

### 6. Cleaning Final State

```javascript
// Return only needed keys
fn((state) => {
  return {
    data: state.data,
  };
});

// Or remove sensitive data
fn((state) => {
  const { username, password, secrets, ...rest } = state;
  return rest;
});
```

## Adaptors and Functions

### What is an Adaptor?

An open-source module providing a set of functions that help you perform actions
in a particular system or technology.

### How do I use an Adaptor?

Each job uses an adaptor to perform actions in a particular system or
technology.

For example, the HTTP adaptor provides functions for making HTTP requests:

```js
get("/endpoint");
post("/endpoint", $.data);
```

### Adaptor functions

You can find a list of available adaptors here:
https://docs.openfn.org/adaptors. Each adaptor has a set of functions with
examples. Also you can use CLI to see documentation for an adaptor:

```bash
// Show all http adaptor functions
openfn docs http
```

For more details on a specfic functions, use:

```bash
// Show documentation for a get() function
openfn docs http get
```

## Best Practices

### 1. Code Organization

- Use multiple small operations rather than few complex ones
- Each operation should do ONE thing
- Keep callbacks simple and focused

### 2. Error Handling

- Let jobs fail when appropriate - this communicates problems
- Use `.catch()` for specific error handling
- Log errors for debugging
- For batch processing, catch individual item errors to prevent one bad item
  from failing the entire batch

### 3. Performance

- Use lazy state (`$`) for cleaner code
- Break complex workflows into multiple workflows
- Clean up final state to reduce data size
- Process data in batches

### 4. Debugging

- Use `console.log()` liberally during development
- Test with small data sets first
- Use the OpenFn CLI to test locally
- Check compiled code with `openfn compile` if needed

### 5. Security

- Never hardcode credentials - use `$.configuration`
- Clean sensitive data from final state
- OpenFn automatically scrubs `configuration` and functions from logs

## Example Complete Job

```javascript
// Initialize
fn((state) => {
  state.errors = [];
  state.successful = [];
  return state;
});

// Set cursor for incremental sync
cursor((state) => state.cursor, { defaultValue: "yesterday" });

// Fetch new records
get((state) => `/patients?modified_since=${state.cursor}`);

// Transform and upload each patient
each(
  "$.data.patients[*]",
  create("Patient__c", (state) => ({
    External_ID__c: state.data.id,
    FirstName: state.data.first_name,
    LastName: state.data.last_name,
    Email: state.data.email,
    Phone: state.data.phone,
  }))
    .then((state) => {
      state.successful.push(state.data.id);
      return state;
    })
    .catch((error, state) => {
      state.errors.push({
        id: state.data.id,
        error: error.message,
      });
      return state; // Continue processing other items
    })
);

// Update cursor
cursor("now");

// Clean final state
fn((state) => {
  return {
    successful: state.successful,
    errors: state.errors,
    total: state.successful.length + state.errors.length,
  };
});
```

## Resources

- Full documentation: https://docs.openfn.org
- Adaptor library: https://docs.openfn.org/adaptors
- Community forum: https://community.openfn.org
- CLI documentation: https://docs.openfn.org/documentation/cli
- Job writing guide:
  https://docs.openfn.org/documentation/jobs/job-writing-guide
