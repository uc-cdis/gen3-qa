Feature('Synapse Login')

const user = require('../../utils/user.js');
const chai = require('chai');
const {interactive, ifInteractive} = require('../../utils/interactive.js');
const expect = chai.expect;
const hostname = process.env.HOSTNAME;
const profile = process.env.NAMESPACE;

Scenario('Login with Google / Microsoft @manual', ifInteractive(
    async(I) => {
        const result = await interactive (`
            1. Go to https://qa-brain.planx-pla.net
            2. Check Dictionary button and check if graphic representation of data model is visible
            3. Also check other button on the top menu bar
            4. Login with Google / Microsoft credentials, check the login works
            5. Log out from the Google / Microsoft account
        `);
    expect(result.didPass, result.details).to,be.true;
    }
));

Scenario('Login with Synapse @manual', ifInteractive(
    async(I) => {
        const result = await interactive (`
            1. Go to https://qa-brain.planx-pla.net
            2. Login with BEAT-PD button (with correct credentials and incorrect credentials)
            3. the user is redirected to Synapse site, click on 'Allow' which redirects to https://qa-brain.planx-pla.net
            4. 
        `);
    expect(result.didPass, result.details).to,be.true;
    }
));

