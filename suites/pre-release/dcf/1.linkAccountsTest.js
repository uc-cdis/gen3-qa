// Feature # 1 in the sequence of testing
// This test plan has a few pre-requisites: Check prereq.md for more details.
Feature('1. Linking accounts - DCF Staging testing for release sign off - PXP-3836');

// To be executed with GEN3_SKIP_PROJ_SETUP=true
// No need to set up program/retrieve access token, etc.
const { expect } = require('chai');
const fenceProps = require('../../../services/apis/fence/fenceProps.js');
const { interactive, ifInteractive } = require('../../../utils/interactive.js');
const { requestUserInput, getAccessTokenHeader } = require('../../../utils/apiUtil');
const oidcUtils = require('../../../utils/oidcUtils');

// Test elaborated for nci-crdc but it can be reused in other projects
const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'nci-crdc-staging.datacommons.io';

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
              2. Login with NIH account
              3. Check if the Profile page contains projects the user can access
              e.g., The projects are usually named as "phs000178".
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #2 - Link Google account from the "customer" GCP account to the NIH user
oidcUtils.linkGoogleAccount();

// Scenario #3 - Set expiration date for the linked Google Account
oidcUtils.performAdjustExpDateTest('positive');

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

oidcUtils.performAdjustExpDateTest('negative');

// Google login is not enabled for DCF
// Scenario #5 - Link Google account with the NIH user again
// to support the next features in the sequence
// linkGoogleAccount();
