// To be executed with GEN3_SKIP_PROJ_SETUP=true
// No need to set up program / retrieve access token, etc.

Feature('Testing OIDC flow with Google credentials & NIH');
const { expect } = require('chai');
const { interactive, ifInteractive } = require('../../../utils/interactive.js');
const oidcUtils = require('../../../utils/oidcUtils');
const {
  Gen3Response,
  requestUserInput,
  // parseJwt,
} = require('../../../utils/apiUtil');

// Test elaborated for DataSTAGE but it can be reused in other projects
const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'preprod.gen3.biodatacatalyst.nhlbi.nih.gov';

BeforeSuite(async ({ I }) => {
  console.log('Setting up dependencies...');
  I.cache = {};

  if (process.env.TEST_CLIENT_ID === undefined) {
    throw new Error(`ERROR: There is no client_id defined for this ${TARGET_ENVIRONMENT} Test User. Please declare the "TEST_CLIENT_ID" environment variable and try again. Aborting test...`);
  } else if (process.env.TEST_SECRET_ID === undefined) {
    throw new Error(`ERROR: There is no secret_id defined for this ${TARGET_ENVIRONMENT} Test User. Please declare the "TEST_SECRET_ID" environment variable and try again. Aborting test...`);
  } else if (process.env.TEST_IMPLICIT_ID === undefined) {
    throw new Error(`ERROR: There is no implicit_id defined for this ${TARGET_ENVIRONMENT} Test User. Please declare the "TEST_IMPLICIT_ID" environment variable and try again. Aborting test...`);
  }
});
// Scenario #1 - OIDC Client flow with Google credentials
Scenario('Initiate the OIDC Client flow with Google credentials to obtain the OAuth authorization code @manual', ifInteractive(
  async ({ I }) => {
    I.cache.NONCE = Date.now();
    const result = await interactive(await oidcUtils.printOIDCFlowInstructionsAndObtainTokens(I, 'Google', TARGET_ENVIRONMENT));
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #2 - Verify Nonce
Scenario('Verify if the ID Token produced in the Google-OIDC scenario above has the correct nonce value @manual', ifInteractive(
  async ({ I }) => {
    const result = await oidcUtils.runVerifyNonceScenario(I.cache.NONCE);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #16 - Implicit OIDC Client Flow
Scenario('Initiate the Implicit OIDC Client flow with Google credentials to obtain the OAuth authorization code @manual', ifInteractive(
  async ({ I }) => {
    I.cache.NONCE = Date.now();
    console.log(`1. Using the "Implicit id" provided, paste the following URL into the browser (replacing the CLIENT_ID placeholder accordingly):
                 https://${TARGET_ENVIRONMENT}/user/oauth2/authorize?redirect_uri=https://${TARGET_ENVIRONMENT}&client_id=${process.env.TEST_IMPLICIT_ID}&scope=openid+user+data+google_credentials&response_type=id_token+token&nonce=test-nonce-${I.cache.NONCE}

                NOTE: you may get a 401 error invalid_request: Replay attack failed to authorize (this has to do with the nonce provided, it should be unique per request so if someone else tried with it, you may see this error. Simply change the nonce to something else.)
               // Expect a redirect with an URL containing the "id_token"`);

    const idToken = await requestUserInput('Please paste in your ID Token to verify the nonce: ');

    const result = await interactive(`
              2. [Automated] Compare nonces:
                 This is the nonce from the previous step: ${I.cache.NONCE}
                 And this is the nonce obtained after decoding your ID Token: ${oidcUtils.findNonce(idToken)}
                 Result: ${I.cache.NONCE === oidcUtils.findNonce(idToken)}

              // Confirm if the numbers match.
      `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// ###############################
// Scenarios with NIH account
// ###############################

// Scenario #7 - Starting the OIDC flow again with NIH credentials
Scenario('Initiate the OIDC Client flow with NIH credentials to obtain the OAuth authorization code @manual', ifInteractive(
  async ({ I }) => {
    I.cache.NONCE = Date.now();
    console.log('Click on the logout button so you can log back in with your NIH account.');
    // reset access token
    delete I.cache.ACCESS_TOKEN;
    const result = await interactive(await oidcUtils.printOIDCFlowInstructionsAndObtainTokens(I, 'NIH', TARGET_ENVIRONMENT));
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #8 - Verify Nonce again
// Scenario #2 - Verify Nonce
Scenario('Verify if the ID Token produced in the NIH-OIDC scenario above has the correct nonce value @manual', ifInteractive(
  async ({ I }) => {
    const result = await oidcUtils.runVerifyNonceScenario(I.cache.NONCE);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #3 - Run PreSigned URL with access token obtained through the OIDC flow
Scenario('Perform PreSigned URL test @manual', ifInteractive(
  async ({ I, fence }) => {
    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide the ACCESS_TOKEN obtained through the OIDC bootstrapping: ');
    const httpResp = await I.sendGetRequest(
      `https://${TARGET_ENVIRONMENT}/index/index`,
    ).then((res) => new Gen3Response(res));

    const { records } = httpResp.body;

    const signedUrlRes = await fence.do.createSignedUrl(
      records[0].did,
      [],
      oidcUtils.assembleCustomHeaders(I.cache.ACCESS_TOKEN),
    );

    const result = await interactive(`
                1. [Automated] Executed a PreSigned URL request (using the ACCESS_TOKEN provided).
                2. Verify if the ACCESS TOKEN is valid.

                Manual verification:
                  HTTP Code: ${signedUrlRes.status}
                  RESPONSE: ${JSON.stringify(signedUrlRes.body) || signedUrlRes.parsedFenceError}
              `);
    expect(result.didPass, result.details).to.be.true;
  },
));
