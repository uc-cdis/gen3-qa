// Feature # 3 in the sequence of testing
// This test plan has a few pre-requisites: Check prereq.md for more details.
Feature('2. Google Credentials - DCF Staging testing for release sign off - PXP-3836');

// To be executed with GEN3_SKIP_PROJ_SETUP=true
// No need to set up program / retrieve access token, etc.

const { expect } = require('chai');
const fenceProps = require('../../../services/apis/fence/fenceProps.js');
const { interactive, ifInteractive } = require('../../../utils/interactive.js');
const {
  getAccessTokenHeader, requestUserInput,
} = require('../../../utils/apiUtil');

// Test elaborated for nci-crdc but it can be reused in other projects
const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'nci-crdc-staging.datacommons.io';

BeforeSuite(async ({ I }) => {
  console.log('Setting up dependencies...');
  I.cache = {};
  I.TARGET_ENVIRONMENT = TARGET_ENVIRONMENT;
});

// TODO: Consolidate some of the common scenarios across other executable tests to avoid duplicates
// e.g., The "Temp Access Keys" check is also included in suites/apis/dataStageOIDCFlowTest.js

// Scenario #1 - Retrieve temporary access keys
Scenario('Obtain temporary access keys (Google Credentials) @manual', ifInteractive(
  async ({ I, fence }) => {
    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
    const httpResp = await fence.do.createTempGoogleCreds(
      getAccessTokenHeader(I.cache.ACCESS_TOKEN),
    );

    const result = await interactive(`
            1. [Automated] Send a HTTP POST request with the NIH user's ACCESS TOKEN to retrieve the contents of Google's temporary access keys:
              HTTP POST request to: https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.googleCredentials}
            Manual verification:
              Response status: ${httpResp.status} // Expect a HTTP 200
              Response data: ${JSON.stringify(httpResp.body) || httpResp.parsedFenceError}
                // Expect a JSON payload containing client information (id, email, etc.) and a private key
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #2 - Get list of access keys
Scenario('List the available temporary access keys (Google Credentials) @manual', ifInteractive(
  async ({ I, fence }) => {
    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
    const httpResp = await fence.do.getUserGoogleCreds(
      getAccessTokenHeader(I.cache.ACCESS_TOKEN),
    );

    const result = await interactive(`
            1. [Automated] Send a HTTP GET request with the NIH user's ACCESS TOKEN to list the available keys:
              HTTP GET request to: https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.googleCredentials}
            Manual verification:
              Response data: ${JSON.stringify(httpResp)}
                // Expect a JSON payload containing a list of GOOGLE_PROVIDED keys
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #3 - Delete access keys
Scenario('Delete access keys (Google Credentials) @manual', ifInteractive(
  async ({ I, fence }) => {
    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
    const keysHttpResp = await fence.do.getUserGoogleCreds(
      getAccessTokenHeader(I.cache.ACCESS_TOKEN),
    );
    const someKeyId = keysHttpResp.access_keys[0].name.split('/').slice(-1)[0];

    const httpResp = await fence.do.deleteTempGoogleCreds(
      someKeyId,
      getAccessTokenHeader(I.cache.ACCESS_TOKEN),
    );

    const result = await interactive(`
            1. [Automated] Send a HTTP DELETE request with the NIH user's ACCESS TOKEN to delete one of the access keys:
              HTTP DELETE request to: https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.googleCredentials}/${someKeyId}
            Manual verification:
              Response status: ${httpResp.status} // Expect a HTTP 204
              Response data: ${JSON.stringify(httpResp.body) || httpResp.parsedFenceError}
                // Expect an empty response
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #4 - Obtain temporary access keys with expiration time
Scenario('Obtain temporary access keys with specific expiration time (Google Credentials) @manual', ifInteractive(
  async ({ I, fence }) => {
    const expirationDateInSecs = 10800;

    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
    const httpResp = await fence.do.createTempGoogleCreds(
      getAccessTokenHeader(I.cache.ACCESS_TOKEN),
      expirationDateInSecs,
    );

    const result = await interactive(`
            1. [Automated] Send a HTTP POST request with the NIH user's ACCESS TOKEN to retrieve the contents of Google's temporary access keys:
              HTTP POST request to: https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.googleCredentials}?expires_in=${expirationDateInSecs}
            Manual verification:
              Response status: ${httpResp.status} // Expect a HTTP 200
              Response data: ${JSON.stringify(httpResp.body) || httpResp.parsedFenceError}
                // Expect a JSON payload containing client information (id, email, etc.) and a private key
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #5 - Try to delete an access key that does not exist
Scenario('Negative test - Delete a non-existing access keys (Google Credentials) @manual', ifInteractive(
  async ({ I, fence }) => {
    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
    const someKeyId = 'aa123bb456cc'; // pragma: allowlist secret

    const httpResp = await fence.do.deleteTempGoogleCreds(
      someKeyId,
      getAccessTokenHeader(I.cache.ACCESS_TOKEN),
    );

    const result = await interactive(`
            1. [Automated] Send a HTTP DELETE request with the NIH user's ACCESS TOKEN to delete one of the access keys:
              HTTP DELETE request to: https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.googleCredentials}/${someKeyId}
            Manual verification:
              Response status: ${httpResp.status} // Expect a HTTP 404
              Response data: ${JSON.stringify(httpResp.body) || httpResp.parsedFenceError}
                // Expect a "key not found" message
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));
