const { expect } = require('chai');
const { interactive, ifInteractive } = require('../../utils/interactive.js');

Feature('Redirect invalid urls to 404 page @requires-portal');

Scenario('Valid urls are not redirected to 404 page @manual', ifInteractive(
  async () => {
    const result = interactive(`
              1. Navigate to a valid url like https://qa-brain.planx-pla.net/profile
              2. User is not redirected to the 404 page
              3. Navigate to a valid url like https://qa-brain.planx-pla.net/DEV-test
              4. User is not redirected to the 404 page
          `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Invalid urls get redirected to 404 page @manual', ifInteractive(
  async () => {
    const result = interactive(`
            1. Navigate to an invalid url like https://qa-brain.planx-pla.net/invalid_page
            2. User is redirected to the 404 page
            3. Navigate to an invalid url like https://qa-brain.planx-pla.net/invalid_page/invalid_subpage
            4. User is redirected to the 404 page
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));
