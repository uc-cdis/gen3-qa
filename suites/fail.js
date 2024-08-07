const { expect } = require('chai');

Feature('Failing tests');

Scenario('Force failure @fail', () => {
  expect.fail('Failed!');
});
