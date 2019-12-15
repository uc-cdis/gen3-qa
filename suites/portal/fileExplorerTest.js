Feature('File Explorer - https://ctds-planx.atlassian.net/browse/PXP-4777');

const chai = require('chai');
const { interactive, ifInteractive } = require('../../utils/interactive.js');

const { expect } = chai;

/*
Data Setup:
    1. Commons_1 - URL configured in gitops.json ("getAccessButtonLink": "https://dbgap.ncbi.nlm.nih.gov/")
        i) User_11 - No access to some data
        ii) User_12 - Access to all data
    2. Commons_2 - URL not configured
        i) User_21 - No access to some data
        ii) User_22 - Access to all data
 */


Scenario('Get Access button is not displayed when portal configuration "hideGetAccessButton" is set to true @manual', ifInteractive(
  async (I) => {
    const result = await interactive(`
            1. Set the hideAccessButton to true in the portal config (portal/gitops.json) 
            2. Configure the Access Button URL (URL configured in gitops.json as "getAccessButtonLink": "https://dbgap.ncbi.nlm.nih.gov/")
            3. Roll the portal via "gen3 kube-setup-portal" command
            2. Log in to commons as User_11 (user without access to some data)
            3. Navigate to Files Explorer page (e.g. https://qa-brain.planx-pla.net/files)
            4. "Get Access" button is not displayed
            2. Remove the Access Button URL (remove element "getAccessButtonLink" from gitops.json)
            3. Roll the portal via "gen3 kube-setup-portal" command
            2. Log in to commons as User_11 (user without access to some data)
            3. Navigate to Files Explorer page (e.g. https://qa-brain.planx-pla.net/files)
            4. "Get Access" button is not displayed
       `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Get Access button is enabled when commons has url configured, hideGetAccessButton is set to false and user does not have full access @manual', ifInteractive(
  async (I) => {
    const result = await interactive(`
            1. Log in to Commons_1 (URL configured in gitops.json as "getAccessButtonLink": "https://dbgap.ncbi.nlm.nih.gov/") as User_11 (user without access to some data)
            2. Navigate to Files Explorer page (e.g. https://qa-brain.planx-pla.net/files)
            3. Get Access button is enabled
            4. Clicking on it takes the user to dbgap access request page
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Get Access button is not displayed when commons has url configured, hideGetAccessButton is set to false and user has full access @manual', ifInteractive(
  async (I) => {
    const result = await interactive(`
            1. Log in to Commons_1 (URL configured in gitops.json as "getAccessButtonLink": "https://dbgap.ncbi.nlm.nih.gov/") as User_12 (user with full access to data)
            2. Navigate to Files Explorer page (e.g. https://qa-brain.planx-pla.net/files)
            3. Get Access button is not displayed
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Get Access button is disabled when commons does not have url configured, hideGetAccessButton is set to false and user has no access @manual', ifInteractive(
  async (I) => {
    const result = await interactive(`
            1. Log in to Commons_2 (URL not configured in gitops.json as "getAccessButtonLink") as User_21 (user without access to some data)
            2. Navigate to Files Explorer page (e.g. https://qa-brain.planx-pla.net/files)
            3. Get Access button is disabled with a tooltip saying "Coming Soon"
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Get Access button is not displayed when commons does not have url configured, hideGetAccessButton is set to false and user has full access @manual', ifInteractive(
  async (I) => {
    const result = await interactive(`
            1. Log in to Commons_2 (URL not configured in gitops.json as "getAccessButtonLink") as User_22 (user with full access to data)
            2. Navigate to Files Explorer page (e.g. https://qa-brain.planx-pla.net/files)
            3. Get Access button is not displayed
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

Scenario('Verify labels on the charts in File Explorer page @manual', ifInteractive(
  async (I) => {
    const result = await interactive(`
            1. Log in to Commons_2 (URL not configured in gitops.json as "getAccessButtonLink") as User_22 (user with full access to data)
            2. Navigate to Files Explorer page (e.g. https://qa-brain.planx-pla.net/files)
            3. The charts are labeled correctly as "File Type" and "File Format"
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));
