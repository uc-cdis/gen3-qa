Feature('File Explorer');

/*
Data Setup:
    1. Commons_1 - URL configured
        i) User_11 - No access to some data
        ii) User_12 - Access to all data
    2. Commons_2 - URL not configured
        i) User_21 - No access to some data
        ii) User_22 - Access to all data
 */

Scenario('Get Access button is enabled when commons has url configured and user does not have access @manual', ifInteractive(
    async (I) => {
        const result = await interactive(`
            1. Log in to Commons_1 (url configured) as User_11 (no access)
            2. Navigate to Files Explorer page
            3. Get Access button is enabled
            4. Clicking on it takes the user to dbgap access request page
        `);
        expect(result.didPass, result.details).to, be.true;
    }
));

Scenario('Get Access button is not displayed when commons has url configured and user has full access @manual', ifInteractive(
    async (I) => {
        const result = await interactive(`
            1. Log in to Commons_1 (url configured) as User_12 (full access)
            2. Navigate to Files Explorer page
            3. Get Access button is not displayed
        `);
        expect(result.didPass, result.details).to, be.true;
    }
));

Scenario('Get Access button is disabled when commons does not have url configured and user has no access @manual', ifInteractive(
    async (I) => {
        const result = await interactive(`
            1. Log in to Commons_2 (url not configured) as User_21 (no access)
            2. Navigate to Files Explorer page
            3. Get Access button is disabled
        `);
        expect(result.didPass, result.details).to, be.true;
    }
));

Scenario('Get Access button is not displayed when commons does not have url configured and user has full access @manual', ifInteractive(
    async (I) => {
        const result = await interactive(`
            1. Log in to Commons_2 (url not configured) as User_22 (full access)
            2. Navigate to Files Explorer page
            3. Get Access button is not displayed
        `);
        expect(result.didPass, result.details).to, be.true;
    }
));
