Feature('Homepage Chart Nodes');
// Homepage Chart Nodes documentation: https://github.com/uc-cdis/cdis-wiki/blob/0d828c73dcec7f37eba63ac453e56f1d4ce46d47/dev/gen3/guides/ui_etl_configuration.md#portal-folder

const { expect } = require('chai');
const { interactive, ifInteractive } = require('../../utils/interactive.js');

/**
 * Setup
 * 1. Peregrine should have public datasets endabled
 *      (manifest.json: `global.public_datasets: true`)
 * 2. Test user should have access to at least one project (_accessible projects_)
 *      and should not have access to at least one project (_unaccessible projects_)
 * 3. Homepage Chart Nodes feature should be ENABLED: The
 *      `components.index.homepageChartNodes` field should be set in the [portal config](https://github.com/uc-cdis/cdis-wiki/blob/0d828c73dcec7f37eba63ac453e56f1d4ce46d47/dev/gen3/guides/ui_etl_configuration.md#portal-folder).
 */
Scenario('When Homepage Charts is enabled, logged-out users should see summary charts of all data on the landing page @manual', ifInteractive(
  async () => {
    const result = await interactive(`
      1. Without logging in, go to landing page ('/')
      2. Landing page should display a table showing summary data for all projects in the commons.
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('When Homepage Charts is enabled, logged-in users should see summary charts of all data on the landing page @manual', ifInteractive(
  async () => {
    const result = await interactive(`
      1. Log in as the test user and go to landing page ('/')
      2. Landing page should display a table showing summary data for all projects in the commons.
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('When Homepage Charts is enabled, logged-in users should only see projects they have access to listed on the /submission page @manual', ifInteractive(
  async () => {
    const result = await interactive(`
      1. Log in as the test user and go to landing page ('/submission')
      2.  The /submission page should have a table titled 'List of Projects'. The table should ONLY list the _accessible projects_.
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));

/**
 * Setup
 * 1. Peregrine should have public datasets endabled
 *      (manifest.json: `global.public_datasets: true`)
 * 2. Test user should have access to at least one project (_accessible projects_)
 *      and should not have access to at least one project (_unaccessible projects_)
 * 3. Homepage Chart Nodes feature should be DISABLED: The
 *      `components.index.homepageChartNodes` field should NOT be set in the [portal config](https://github.com/uc-cdis/cdis-wiki/blob/0d828c73dcec7f37eba63ac453e56f1d4ce46d47/dev/gen3/guides/ui_etl_configuration.md#portal-folder).
 */
Scenario('When Homepage Charts is disabled, the landing page should redirect logged-out users to the login page @manual', ifInteractive(
  async () => {
    const result = await interactive(`
      1. Without logging in, go to landing page ('/')
      2. Landing page should redirect to login page ('/login')
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('When Homepage Charts is disabled, logged-in users should see summary charts of ONLY the projects they have access to on the landing page @manual', ifInteractive(
  async () => {
    const result = await interactive(`
      1. Log in as the test user and go to landing page ('/')
      2. Landing page should display a table showing summary data for ONLY the projects the test user has access to.
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));
