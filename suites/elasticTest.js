Feature('es');

const { expect } = require('chai');
const { search } = require('../utils/elasticsearch.js');

const index = 'etl_mickey_1';
const query = '{ "query": { "nested": { "path": "BCMAMedicationLog", "query": { "range": { "BCMAMedicationLog.DosesOrdered": { "lt": 0.0029 } } } } } }';

// Sample scenarios to query elasticsearch and validate results
// scenario marked as manual to prevent it from running in CI pipeline
Scenario('check length', async () => {
  const res = await search(index, query);
  expect(res.length).to.equal(1);
}).tag('@manual');

// scenario marked as manual to prevent it from running in CI pipeline
Scenario('check id of first', async () => {
  const res = await search(index, query);
  /* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
  expect(res[0]._id).to.equal('22');
}).tag('@manual');
