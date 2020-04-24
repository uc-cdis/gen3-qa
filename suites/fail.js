const { expect } = require('chai');

Feature('Failing tests');


Scenario('Force failure', () => {
  expect.fail('Failed!');
});
