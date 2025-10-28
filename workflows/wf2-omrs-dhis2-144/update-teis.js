// Update TEIs
create(
  "tracker",
  { trackedEntities: $.teisToUpdate },
  { params: { async: false, importStrategy: "UPDATE" } }
);

fn(({ lastRunDateTime }) => ({ lastRunDateTime }));
