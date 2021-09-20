Feature('Discovery Page');

const { expect } = require('chai');
const { interactive, ifInteractive } = require('../../utils/interactive.js');

Scenario('The Discovery page tags and searching should work as normal @manual', ifInteractive(
  async () => {
    const result = await interactive(`
    1. On the Discovery page, select any tag in the tag header. Expect the studies displayed in the table to contain that tag and the header statistics to change.
    2. Type a query into the search bar. Expect the studies displayed in the table to contain the search query and the header statistics to change.
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('The Discovery Page and Exploration page should show the same number of studies and subjects @manual', ifInteractive(
  async () => {
    const result = await interactive(`
    1. On the Discovery page, make note of the number of studies and subjects in the header stats.
    2. Log in and go to the Explorer page.
    3. (If present) select 'All Data' in the Tiered Access selector.
    4. Ensure that the number of studies and number of subjects on the Explorer page is equal to the number of studies and subjects on the Discovery page.
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));

/* Assumes authorization is enabled (discoveryConfig.features.authorization.enabled = true) */
Scenario('If authorization is enabled, my access should be the same between the Discovery Page and the Explorer @manual', ifInteractive(
  async () => {
    const result = await interactive(`
    1. Log in as any user with access to at least one study.
    2. Go to the Discovery page and find a study you have access to. Write down the study's name. (You can set the access selector to the 'Unlock' icon.)
    3. While on the Discovery page, find a study you do not have access to. Write down the study's name.
    4. Go to the Explorer page. Expect to have access to the study from step 2, and to not have access to the study from step 3.
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));
