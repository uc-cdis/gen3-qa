// Feature # 1 in the sequence of testing
// This test plan has a few pre-requisites: Check prereq.md for more details.
Feature('1. Linking accounts - DCF Staging testing for release sign off - https://ctds-planx.atlassian.net/browse/PXP-3836');

// To be executed with GEN3_SKIP_PROJ_SETUP=true -- No need to set up program / retrieve access token, etc.

const chai = require('chai');
const fenceProps = require('../../../services/apis/fence/fenceProps.js');
const user = require('../../../utils/user.js');
const { interactive, ifInteractive } = require('../../../utils/interactive.js');
const { Gen3Response, getAccessTokenFromExecutableTest, getAccessTokenHeader } = require('../../../utils/apiUtil');

const { expect } = chai;

// Test elaborated for nci-crdc but it can be reused in other projects
const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'nci-crdc-staging.datacommons.io';

function linkGoogleAccount() {
  Scenario('Link Google identity to the NIH user @manual', ifInteractive(
    async (I, fence) => {
	    const result = await interactive(`
              1. Navigate to https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.linkGoogle}
              2. Provide the credentials of the Google account that owns the "Customer" GCP account
                 This Google account will be linked to the NIH account within this Gen3 environment.
            `);
	    expect(result.didPass, result.details).to.be.true;
    },
  ));
}

function performAdjustExpDateTest(type_of_test) {
  Scenario('Adjust the expiration date of the Google account that has been linked @manual', ifInteractive(
    async (I, fence) => {
	    const ACCESS_TOKEN = await getAccessTokenFromExecutableTest(I);
	    console.log(`access token: ${ACCESS_TOKEN}`);

	    // Arbitrarily setting linked Google account to expire in 2 hours
	    const expiration_date_in_secs = 7200;

	    // set a userAcct obj {} with an "accessTokenHeader" property to use Gen3-qa's Fence testing API
      const http_resp = await fence.do.extendGoogleLink(
        { accessTokenHeader: getAccessTokenHeader(ACCESS_TOKEN) },
        expiration_date_in_secs,
      );

	    const { expected_status, expected_response } = type_of_test == 'positive'
        ? { expected_status: 200, expected_response: 'new "exp" date (should express <current time + 2hs>)' }
        : { expected_status: 404, expected_response: '"User does not have a linked Google account." message' };

	    const result = await interactive(`
              1. [Automated] Send a HTTP PATCH request with the NIH user's ACCESS TOKEN to adjust the expiration date of a Google account (?expires_in=<current epoch time + 2 hours>):
              HTTP PATCH request to: https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.extendGoogleLink}\?expires_in\=${expiration_date_in_secs}
              Manual verification:
                Response status: ${http_resp.status} // Expect a HTTP ${expected_status}
                Response data: ${JSON.stringify(http_resp.body) || http_resp.parsedFenceError} // Expect response containing the ${expected_response}
              Converting epoch to timestamp: ${http_resp.status == 200 ? new Date(new Date(0).setUTCSeconds(http_resp.body.exp)).toLocaleString() : 'cannot convert invalid response'}
            `);
	    expect(result.didPass, result.details).to.be.true;
    },
  ));
}

BeforeSuite(async (I) => {
  console.log('Setting up dependencies...');
  I.TARGET_ENVIRONMENT = TARGET_ENVIRONMENT;
});

// Scenario #1 - Verifying NIH access and permissions (project access)
Scenario(`Login to https://${TARGET_ENVIRONMENT} and check the Project Access list under the Profile page @manual`, ifInteractive(
  async (I) => {
    const result = await interactive(`
              1. Go to https://${TARGET_ENVIRONMENT}
              2. Login with NIH account
              3. Check if the Profile page contains projects the user can access
              e.g., The projects are usually named as "phs000178".
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #2 - Link Google account from the "customer" GCP account to the NIH user
linkGoogleAccount();

// Scenario #3 - Set expiration date for the linked Google Account
performAdjustExpDateTest('positive');

// Scenario #4 - Unlink Google account from the "customer" GCP account so it will be no longer associated with the NIH user
Scenario('Unlink Google identity from the NIH user @manual', ifInteractive(
  async (I, fence) => {
    const ACCESS_TOKEN = await getAccessTokenFromExecutableTest(I);
    console.log(`access token: ${ACCESS_TOKEN}`);

    const http_resp = await fence.do.unlinkGoogleAcct({ accessTokenHeader: getAccessTokenHeader(ACCESS_TOKEN) });

    const result = await interactive(`
              1. [Automated] Send a HTTP DELETE request with the NIH user's ACCESS TOKEN to unlink the Google account:
              HTTP DELETE request to: https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.deleteGoogleLink}
              Manual verification:
                Response status: ${http_resp.status} // Expect a HTTP 200
                Response data: ${JSON.stringify(http_resp.body) || http_resp.parsedFenceError} // Expect "undefined"
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

performAdjustExpDateTest('negative');

// Scenario #5 - Link Google account with the NIH user again to support the next features in the sequence
linkGoogleAccount();
