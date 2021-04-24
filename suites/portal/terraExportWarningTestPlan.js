Feature('Terra Export Warning Test Plan');
// This is a temporary feature documented in [PXP-5186](https://ctds-planx.atlassian.net/browse/PXP-5186)
// that warns users about a limitation in Terra when exporting more than 165,000 entities
// that causes PFB handoff jobs to fail on Terra's end. This test plan should be removed
// when this feature is no longer necessary (When Terra fixes the issue on their end.)

const { expect } = require('chai');
const { interactive, ifInteractive } = require('../../utils/interactive.js');

/**
 * Setup
 * 1. Portal should have export to Terra warning enabled, with a cutoff of N subjects
 *      (gitops.json: `"terraExportWarning": { "subjectCountThreshold": N }`)
 * 2. Portal should have Export to Terra feature enabled
 *      (gitops.json: `dataExplorerConfig.buttons` should contain a button of `"type": "export"`)
 * 3. Test user should have access to at least N subjects.
 */
Scenario('When Terra Export Warning is enabled, user should be warned when exporting more than N subjects @manual', ifInteractive(
  async () => {
    const result = await interactive(`
      1. Go to explorer page ('/explorer')
      2. Select N or more subjects.
      3. Click 'Export to Terra'
      4. Expect to see a popup warning the user that the export may fail, with buttons to continue or cancel.
      5. Expect that when the continue button is clicked, the export to Terra process is started.
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('When Terra Export Warning is enabled, user should NOT be warned when exporting FEWER than N subjects @manual', ifInteractive(
  async () => {
    const result = await interactive(`
      1. Go to explorer page ('/explorer')
      2. Select fewer than N subjects.
      3. Click 'Export to Terra'
      5. Expect that the export to Terra process is started, without a popup.
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));

/**
 * (Regression Test)
 * Setup
 * Same as above, except:
 * 1. Export to Terra warning should be DISABLED. (gitops.json: no `terraExportWarning`)
 */
Scenario('When Terra Export Warning is DISABLED, user should NOT be warned when exporting N or more subjects @manual', ifInteractive(
  async () => {
    const result = await interactive(`
      1. Go to explorer page ('/explorer')
      2. Select N or more subjects.
      3. Click 'Export to Terra'
      5. Expect that the export to Terra process is started, without a popup.
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));
