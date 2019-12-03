// Feature # 3 in the sequence of testing
// This test plan has a few pre-requisites: Check prereq.md for more details.
Feature('3. Google Credentials - DCF Staging testing for release sign off - https://ctds-planx.atlassian.net/browse/PXP-3836');

// To be executed with GEN3_SKIP_PROJ_SETUP=true -- No need to set up program / retrieve access token, etc.

const fenceProps = require('../../../services/apis/fence/fenceProps.js');
const user = require('../../../utils/user.js');
const chai = require('chai');
const {interactive, ifInteractive} = require('../../../utils/interactive.js');
const { Gen3Response, getAccessTokenFromExecutableTest, getAccessTokenHeader, requestUserInput } = require('../../../utils/apiUtil');
const expect = chai.expect;

// Test elaborated for nci-crdc but it can be reused in other projects
const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'nci-crdc-staging.datacommons.io';

BeforeSuite(async(I) => {
    console.log('Setting up dependencies...');
    I.cache = {};
    I.TARGET_ENVIRONMENT = TARGET_ENVIRONMENT;
});

// TODO: Consolidate some of the common scenarios across other executable tests to avoid duplicates
// e.g., The "Temp Access Keys" check is also included in suites/apis/dataStageOIDCFlowTest.js

// Scenario #1 - Retrieve temporary access keys
Scenario(`Obtain temporary access keys (Google Credentials) @manual`, ifInteractive(
    async(I, fence) => {
	if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput("Please provide your ACCESS_TOKEN: ");
	const http_resp = await fence.do.createTempGoogleCreds(getAccessTokenHeader(I.cache.ACCESS_TOKEN));

	const result = await interactive (`
            1. [Automated] Send a HTTP POST request with the NIH user's ACCESS TOKEN to register a service account:
              HTTP POST request to: https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.googleCredentials}
            Manual verification:
              Response status: ${http_resp.status} // Expect a HTTP 200
              Response data: ${JSON.stringify(http_resp.body) || http_resp.parsedFenceError}
                // Expect a JSON payload containing client information (id, email, etc.) and a private key
            `);
	expect(result.didPass, result.details).to.be.true;
    }
));

