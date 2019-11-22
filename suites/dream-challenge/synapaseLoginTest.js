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
            3. Also check other button on the top menu bar such as Exploration, Files and Profile. 
            4. Exploration, Files and Profile tab should take the user to the login page
            5. Login with Google / Microsoft credentials, check the login works
            6. Log out from the Google / Microsoft account
        `);
    expect(result.didPass, result.details).to,be.true;
    }
));

Scenario('Login with Synapse first time @manual', ifInteractive(
    async(I) => {
        const result = await interactive (`
            Note: execute this test, if the user is logging in with Syanpse account for the first time.
            1. Go to https://qa-brain.planx-pla.net
            2. Login with BEAT-PD button (with correct credentials and incorrect credentials)
            3. the user is redirected to Synapse site, click on 'Allow' which redirects to https://qa-brain.planx-pla.net
            4. After being re-directed, there is a 'Terms of Use and Privacy Policy' pop-up on https://qa-brain.planx-pla.net 
            5. the user have to hit 'Agree' two times to get through to the data commons
            6. Log out of Synapse account
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
            4. After being re-directed to the https://qa-brain.planx-pla.net, the user is logged in with the Synapse login email id
        `);
    expect(result.didPass, result.details).to,be.true;
    }
));

Scenario('Landing Page @manual', ifInteractive(
    async(I) => {
        const result = await interactive (`
            1. After successful login, the user is on landing page with Synapse email id displayed on the top right corner
            2. Browse around on the landing page - tabs like Dictionary (if it displays graphical representation of data model), Exploration page, Profile Page
            3. Also check if the user can see any data in the bar-graph on the landing page
        `);
    expect(result.didPass, result.details).to,be.true;
    }
));

Scenario('File Page @manual', ifInteractive(
    async(I) => {
        const result = await interactive (`
            1. Navigate to Files tab, user should see facet filter on left, file graphs and file table on the right
            2. the user selects from the facet and file table changes according to the facet selection
            3. 'Download Manifest' should be enabled depending on the permissions the user has.
            4. Click 'Download Manifest' button and 'file-manifest.json' file is downloaded
        `);
    expect(result.didPass, result.details).to,be.true;
    }
));

Scenario('Profile Page @manual', ifInteractive(
    async(I) => {
        const result = await interactive (`
            1. Click on Profile Tab on the top bar
            2. the user sees 'Create API key' button and table with resource permissions
            3. user clicks on 'Create API key' button and pop-up with API key created for the user
            4. user can download the 'credential.json' to carry out various other test execution against https://qa-brain.planx-pla.net
        `);
    expect(result.didPass, result.details).to,be.true;
    }
));