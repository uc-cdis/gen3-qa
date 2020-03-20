Feature('es');

const { search } = require('../utils/elasticsearch.js');
const { expect } = require('chai');

let index = 'etl_mickey_1';
let query = '{ "query": { "nested": { "path": "BCMAMedicationLog", "query": { "range": { "BCMAMedicationLog.DosesOrdered": { "lt": 0.0029 } } } } } }';

// Sample scenarios to query elasticsearch and validate results
// scenario marked as manual to prevent it from running in CI pipeline
Scenario("check length", async () => {
  let res = await search(index, query);
  expect(res.length === 1);
}).tag('@manual')

// scenario marked as manual to prevent it from running in CI pipeline
Scenario("check id of first", async () => {
  let res = await search(index, query);
  expect(res[0]._id === '22');
}).tag('@manual')