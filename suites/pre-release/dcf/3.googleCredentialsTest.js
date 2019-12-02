// Feature # 3 in the sequence of testing
// This test plan has a few pre-requisites: Check prereq.md for more details.
Feature('3. Google Credentials - DCF Staging testing for release sign off - https://ctds-planx.atlassian.net/browse/PXP-3836');

// To be executed with GEN3_SKIP_PROJ_SETUP=true -- No need to set up program / retrieve access token, etc.

const fenceProps = require('../../../services/apis/fence/fenceProps.js');
const user = require('../../../utils/user.js');
const chai = require('chai');
const {interactive, ifInteractive} = require('../../../utils/interactive.js');
const { Gen3Response, getAccessTokenFromExecutableTest, getAccessTokenHeader } = require('../../../utils/apiUtil');
const expect = chai.expect;

// Test elaborated for nci-crdc but it can be reused in other projects
const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'nci-crdc-staging.datacommons.io';

BeforeSuite(async(I) => {
    console.log('Setting up dependencies...');
    I.TARGET_ENVIRONMENT = TARGET_ENVIRONMENT;
});

// Scenario #1 - Receive temporary access key
Scenario(`Obtain temporary credentials (private key) from GCP @manual`, ifInteractive(
    async(I) => {
        
	const result = await interactive (`
              test TBD
            `);
	expect(result.didPass, result.details).to.be.true;
    }
));