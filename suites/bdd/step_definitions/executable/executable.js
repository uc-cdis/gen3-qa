const { expect } = require('chai');
const { interactive } = require('../../../../utils/interactive');

Given('/(.*)@manual/', async (step) => {
  const result = await interactive(step);
  expect(result.didPass, result.details).to.be.true;
});
