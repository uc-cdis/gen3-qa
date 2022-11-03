Feature('Google Credentials - BDcat testing for release sign off');

// To be executed with GEN3_SKIP_PROJ_SETUP=true
// No need to set up program / retrieve access token, etc.
const { expect } = require('chai');
const fenceProps = require('../../../services/apis/fence/fenceProps.js');
const { interactive, ifInteractive } = require('../../../utils/interactive.js');
const {
  getAccessTokenHeader,
  requestUserInput,
} = require('../../../utils/apiUtil');

// Test elaborated for DataSTAGE but it can be reused in other projects
const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'qa-dcp.planx-pla.net';

BeforeSuite(async ({ I }) => {
  console.log('Setting up dependencies...');
  I.cache = {};
  I.TARGET_ENVIRONMENT = TARGET_ENVIRONMENT;
  // Fetching public list of DIDs
  const httpResp = await I.sendGetRequest(
    `https://${TARGET_ENVIRONMENT}/index/index`,
  );

  I.cache.records = httpResp.data.records;
});

// Scenario #13 - Temporary Service Account Credentials as User
Scenario('Try to get Google Credentials as a regular user @manual', ifInteractive(
  async () => {
    const result = await interactive(`
              1. Copy and paste the following URL into the browser:
                   https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.googleCredentials}
              2. Expect a HTTP 401 message
              `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #14 - Temporary Service Account Credentials as a client
// (with an access token generated through the OIDC flow)
Scenario('Try to get Google Credentials as a client @manual', ifInteractive(
  async ({ I }) => {
    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
    const httpResp = await I.sendPostRequest(
      `https://${TARGET_ENVIRONMENT}/user/credentials/google/`,
      {},
      getAccessTokenHeader(I.cache.ACCESS_TOKEN),
    );

    const result = await interactive(`
              1. [Automated] Send a HTTP POST request with the NIH user's ACCESS TOKEN to register a service account:
                HTTP POST request to: https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.googleCredentials}
              Manual verification:
                Response status: ${httpResp.status} // Expect a HTTP 200
                Response data: ${JSON.stringify(httpResp.data)}
                  // Expect a JSON payload containing client information (id, email, etc.) and a private key
              `);
    expect(result.didPass, result.details).to.be.true;
  },
));
