Feature('Tiered Access');
// Tiered Access documentation: https://github.com/uc-cdis/guppy#tier-access

const { expect } = require('chai');
const { interactive, ifInteractive } = require('../../utils/interactive.js');

/**
 * Setup
 * 1. Test user should have access to at least one project (_accessible project_)
 *      and should not have access to at least one project (_unaccessible project_)
 * 2. Tiered Access should be enabled with a limit of N:
 *  (manifest.json) global.tierAccessLevel: 'regular', global.tierAccessLimit: N
*/

// Checkbox Filter
// - [ ] value    (count)
// - [ ] value    (count)
// - [ ] value    (count)
Scenario('Checkbox Filter for Project IDs should display a visual indicator that user does not have access @manual', ifInteractive(
  async () => {
    const result = await interactive(`
      1. In the /explorer page, select 'All Data' in the Data Access Selector.
      2. In the Project ID filter, all unaccessible projects should display a visual indicator (i.e. a lock icon)
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Checkbox Filter should hide all counts < N @manual', ifInteractive(
  async () => {
    const result = await interactive(`
      1. In the /explorer page, select 'All Data' in the Data Access Selector.
      2. Select an unaccessible project in the Project ID filter.
      3. In all Checkbox filters, counts should only be visible if they are >= N.
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Checkbox Filter should prevent values with counts < N from being selected (and visually indicate that those values are disabled) @manual', ifInteractive(
  async () => {
    const result = await interactive(`
      1. In the /explorer page, select 'All Data' in the Data Access Selector.
      2. Select an unaccessible project in the Project ID filter.
      3. In all Checkbox Filters, values should only be selectable if their counts are >= N.
      4. Values that are unselectable should have a clear visual indicator that they are disabled (e.g. the value's checkbox is greyed out)
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Requires Guppy > 0.4.0
Scenario('If a Checkbox Filter value with count < N is already selected, it should remain selected after selecting an unaccessible project, even if its count is < N @manual', ifInteractive(
  async () => {
    const result = await interactive(`
      1. In the /explorer page, select 'All Data' in the Data Access Selector.
      2. Select an accessible project and an unaccessible project in the Project ID filter.
      3. Find a value whose count is < N. (The value should appear disabled.)
      4. Unselect the unaccessible project.
      5. Select the value from step 3.
      6. Select the unaccessible project.
      7. The value from step 3 should remain selected.
      8. After unselecting the value from step 3, the value should be unselectable.
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Range Filter
// (max)|----range----|(min)
Scenario('Range Filter should not prevent any ranges from being selected, even if the total count of subjects is < N @manual', ifInteractive(
  async () => {
    const result = await interactive(`
      1. In the /explorer page, select 'All Data' in the Data Access Selector.
      2. Select an unaccessible project in the Project ID filter.
      3. In all Checkbox Filters, values should only be selectable if their counts are >= N.
      4. Values that are unselectable should have a clear visual indicator that they are disabled (e.g. the value's checkbox is greyed out)
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));
