Feature('File Explorer - https://ctds-planx.atlassian.net/browse/PXP-4777');

const chai = require('chai');
const {interactive, ifInteractive} = require('../../utils/interactive.js');
const expect = chai.expect;

/*
Data Setup:
    1. Commons_1 - URL configured in gitops.json ("getAccessButtonLink": "https://dbgap.ncbi.nlm.nih.gov/")
        i) User_11 - No access to some data
        ii) User_12 - Access to all data
    2. Commons_2 - URL not configured
        i) User_21 - No access to some data
        ii) User_22 - Access to all data
 */

Scenario('Get Access button is enabled when commons has url configured and user does not have access @manual', ifInteractive(
    async (I) => {
        const result = await interactive(`
            1. Log in to Commons_1 (URL configured in gitops.json as "getAccessButtonLink": "https://dbgap.ncbi.nlm.nih.gov/") as User_11 (user without access to some data)
            2. Navigate to Files Explorer page (e.g. https://qa-brain.planx-pla.net/files)
            3. Get Access button is enabled
            4. Clicking on it takes the user to dbgap access request page
        `);
        expect(result.didPass, result.details).to,be.true;
    }
));

Scenario('Get Access button is not displayed when commons has url configured and user has full access @manual', ifInteractive(
    async (I) => {
        const result = await interactive(`
            1. Log in to Commons_1 (URL configured in gitops.json as "getAccessButtonLink": "https://dbgap.ncbi.nlm.nih.gov/") as User_12 (user with full access to data)
            2. Navigate to Files Explorer page (e.g. https://qa-brain.planx-pla.net/files)
            3. Get Access button is not displayed
        `);
        expect(result.didPass, result.details).to,be.true;
    }
));

Scenario('Get Access button is disabled when commons does not have url configured and user has no access @manual', ifInteractive(
    async (I) => {
        const result = await interactive(`
            1. Log in to Commons_2 (URL not configured in gitops.json as "getAccessButtonLink") as User_21 (user without access to some data)
            2. Navigate to Files Explorer page (e.g. https://qa-brain.planx-pla.net/files)
            3. Get Access button is disabled
        `);
        expect(result.didPass, result.details).to,be.true;
    }
));

Scenario('Get Access button is not displayed when commons does not have url configured and user has full access @manual', ifInteractive(
    async (I) => {
        const result = await interactive(`
            1. Log in to Commons_2 (URL not configured in gitops.json as "getAccessButtonLink") as User_22 (user with full access to data)
            2. Navigate to Files Explorer page (e.g. https://qa-brain.planx-pla.net/files)
            3. Get Access button is not displayed
        `);
        expect(result.didPass, result.details).to, be.true;
    }
));
