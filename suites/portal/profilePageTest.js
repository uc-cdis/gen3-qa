Feature('Windmill configurable profile page @requires-portal');

const chai = require('chai');

const { expect } = chai;
const { interactive, ifInteractive } = require('../../utils/interactive.js');

Scenario('When configuration has showFenceAuthzOnProfile: true, profile page shows projects table from Fence @manual', ifInteractive(
  async () => {
    const result = await interactive(`
      1. In gitops.json set showFenceAuthzOnProfile to true
      2. Log in and go to /profile
      3. Profile page should have table with header: You have access to the following project(s)
      4. Table contents should correspond to user s Fence project access
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('When configuration has showFenceAuthzOnProfile: false, profile page does not show projects table from Fence @manual', ifInteractive(
  async () => {
    const result = await interactive(`
      1. In gitops.json set showFenceAuthzOnProfile to false
      2. Log in and go to /profile
      3. Profile page should not have any table with header: You have access to the following project(s)
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('When configuration has showArboristAuthzOnProfile: true, profile page shows resources table from Arborist @manual', ifInteractive(
  async () => {
    const result = await interactive(`
      1. In gitops.json set showArboristAuthzOnProfile to true
      2. Log in and go to /profile
      3. Profile page should have table with header: You have access to the following resource(s)
      4. Table contents should correspond to user s Arborist permissions
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('When configuration has showArboristAuthzOnProfile: false, profile page does not show resources table from Arborist @manual', ifInteractive(
  async () => {
    const result = await interactive(`
      1. In gitops.json set showArboristAuthzOnProfile to false
      2. Log in and go to /profile
      3. Profile page should not have any table with header: You have access to the following resource(s)
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));
