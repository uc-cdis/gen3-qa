// Feature # 1 in the sequence of testing
// This test plan has a few pre-requisites: Check prereq.md for more details.
Feature('1. Linking accounts - DCF Staging testing for release sign off - PXP-3836');

// To be executed with GEN3_SKIP_PROJ_SETUP=true
// No need to set up program/retrieve access token, etc.
const { expect } = require('chai');
const fenceProps = require('../../../services/apis/fence/fenceProps.js');
const { interactive, ifInteractive } = require('../../../utils/interactive.js');
const { requestUserInput, getAccessTokenHeader } = require('../../../utils/apiUtil');

// Test elaborated for nci-crdc but it can be reused in other projects
const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'nci-crdc-staging.datacommons.io';

function linkGoogleAccount() {
  Scenario('Link Google identity to the NIH user @manual', ifInteractive(
    async () => {
      const result = await interactive(`
              1. Navigate to https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.linkGoogle}
              2. Provide the credentials of the Google account that owns the "Customer" GCP account
                 This Google account will be linked to the NIH account within this Gen3 environment.
      `);
      expect(result.didPass, result.details).to.be.true;
    },
  ));
}

function performAdjustExpDateTest(typeOfTest) {
  Scenario(`Adjust the expiration date of the Google account that has been linked. ${typeOfTest} test @manual`, ifInteractive(
    async ({ I, fence }) => {
      if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
      console.log(`access token: ${I.cache.ACCESS_TOKEN}`);

      // Arbitrarily setting linked Google account to expire in 2 hours
      const expirationDateInSecs = 10800;

      // set a userAcct obj {} with an "accessTokenHeader" property
      // to use Gen3-qa's Fence testing API
      const httpResp = await fence.do.extendGoogleLink(
        { accessTokenHeader: getAccessTokenHeader(I.cache.ACCESS_TOKEN) },
        expirationDateInSecs,
      );

      const { expectedStatus, expectedResponse } = typeOfTest === 'positive'
        ? { expectedStatus: 200, expectedResponse: 'new "exp" date (should express <current time + 2hs>)' }
        : { expectedStatus: 404, expectedResponse: '"User does not have a linked Google account." message' };

      const result = await interactive(`
              1. [Automated] Send a HTTP PATCH request with the NIH user's ACCESS TOKEN to adjust the expiration date of a Google account (?expires_in=<current epoch time + 2 hours>):
              HTTP PATCH request to: https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.extendGoogleLink}?expires_in=${expirationDateInSecs}
              Manual verification:
                Response status: ${httpResp.status} // Expect a HTTP ${expectedStatus}
                Response data: ${JSON.stringify(httpResp.body) || httpResp.parsedFenceError} // Expect response containing the ${expectedResponse}
              Converting epoch to timestamp: ${httpResp.status === 200 ? new Date(new Date(0).setUTCSeconds(httpResp.body.exp)).toLocaleString() : 'cannot convert invalid response'}
      `);
      expect(result.didPass, result.details).to.be.true;
    },
  ));
}

BeforeSuite(async ({ I }) => {
  console.log('Setting up dependencies...');
  I.TARGET_ENVIRONMENT = TARGET_ENVIRONMENT;

  I.cache = {};
});

// Scenario #1 - Verifying NIH access and permissions (project access)
Scenario(`Login to https://${TARGET_ENVIRONMENT} and check the Project Access list under the Profile page @manual`, ifInteractive(
  async () => {
    const result = await interactive(`
              1. Go to https://${TARGET_ENVIRONMENT}
              2. Login with RAS account with UCTestUser129
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

// Scenario #4 - Unlink Google account from the "customer" GCP account
// so it will be no longer associated with the NIH user
Scenario('Unlink Google identity from the NIH user @manual', ifInteractive(
  async ({ I, fence }) => {
    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
    console.log(`access token: ${I.cache.ACCESS_TOKEN}`);

    const httpResp = await fence.do.unlinkGoogleAcct(
      { accessTokenHeader: getAccessTokenHeader(I.cache.ACCESS_TOKEN) },
    );

    const result = await interactive(`
              1. [Automated] Send a HTTP DELETE request with the NIH user's ACCESS TOKEN to unlink the Google account:
              HTTP DELETE request to: https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.deleteGoogleLink}
              Manual verification:
                Response status: ${httpResp.status} // Expect a HTTP 200
                Response data: ${JSON.stringify(httpResp.body) || httpResp.parsedFenceError} // Expect "undefined"
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

performAdjustExpDateTest('negative');

// Google login is not enabled for DCF
// Scenario #5 - Link Google account with the NIH user again
// to support the next features in the sequence
// linkGoogleAccount();
