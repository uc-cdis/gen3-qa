Feature('Tiered Access @requires-portal');

const { interactive, ifInteractive } = require('../../utils/interactive.js');

Scenario('Verify summary charts are displayed for authorized users @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Login to a commons (e.g. https://qa-brain.planx-pla.net) as a user with access to all projects
            2. Navigate to Data Explorer page (/explorer)
            3. Select a project so that all values in all charts are above the TIER_ACCESS_LIMIT
            4. All the summary charts are displayed
            5. Select a project so some values in one of the charts are below the TIER_ACCESS_LIMIT
            6. All the summary charts are displayed
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Verify summary charts are displayed only when all values are above TIER_ACCESS_LIMIT for unauthorized users @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Login to a commons (e.g. https://qa-brain.planx-pla.net) as a user with access to none of the projects
            2. Navigate to Data Explorer page (/explorer)
            3. Select a project so that all values in all charts are above the TIER_ACCESS_LIMIT
            4. All the summary charts are displayed
            5. Select a project so that some values in one of the charts are below the TIER_ACCESS_LIMIT
            6. The summary chart where the values are below the limit is not displayed
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

/*
Data setup should be as described below:
TIER_ACCESS_LIMIT is set to 50
User U1 has access project P1 but does not have access to project P2
P1 contributes category 'Unknown' to the Race chart the value 40
P1 does not contribute to the category 'Multiracial' in the Race chart
P2 contributes category 'Unknown' to the Race chart the value 30
P2 contributes category 'Multiracial' to the Race chart the value 20
*/
Scenario('Verify summary charts displayed correctly for partially authorized users @manual @regression @bugfix', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Login to a commons (e.g. https://qa-brain.planx-pla.net) as a user with access to all projects
            2. Navigate to Data Explorer page (/explorer)
            3. Select projects with and without access that contribute values to charts smaller than the TIER_ACCESS_LIMIT
            4. The summary chart is displayed with values contributed by the projects to which the user has access
            5. With the sample data described above the chart should show Unknown - 40 and not show Multiracial
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));
