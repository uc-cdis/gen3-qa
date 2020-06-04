import { ifInteractive, interactive } from '../../utils/interactive';

const { expect } = require('chai');

Feature('Redirect invalid urls to 404 page');

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
