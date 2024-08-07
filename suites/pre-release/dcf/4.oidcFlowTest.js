/*eslint-disable */
// Feature # 5 in the sequence of testing
// This test plan has a few pre-requisites: Check prereq.md for more details.
Feature('4. OIDC Flow - DCF Staging testing for release sign off - PXP-3836');

// To be executed with GEN3_SKIP_PROJ_SETUP=true
// No need to set up program / retrieve access token, etc.

const { expect } = require('chai');
const { interactive, ifInteractive } = require('../../../utils/interactive.js');
const {
  Gen3Response, requestUserInput,
} = require('../../../utils/apiUtil');

// Test elaborated for nci-crdc but it can be reused in other projects
const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'nci-crdc-staging.datacommons.io';

function assembleCustomHeaders(ACCESS_TOKEN) {
  // Add ACCESS_TOKEN to custom headers
  return {
    Accept: 'application/json',
    Authorization: `bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

// Decode JWT token and find the Nonce value
function findNonce(idToken) {
  const data = idToken.split('.'); // [0] headers, [1] payload, [2] whatever
  const payload = data[1];
  const padding = '='.repeat((payload.length - 4) % 4);
  const decodedData = Buffer.from((payload + padding), 'base64').toString();
  // If the decoded data doesn't contain a nonce, that means the refresh token has expired
  const nonceStr = JSON.parse(decodedData).nonce; // output: test-nounce-<number>
  if (nonceStr === undefined) {
    return 'Could not find nonce. Make sure your id_token is not expired.';
  }
  return parseInt(nonceStr.split('-')[2], 10);
}

BeforeSuite(async ({ I }) => {
  console.log('Setting up dependencies...');
  // making this data accessible in all scenarios through the actor's memory (the "I" object)
  I.cache = {};
  // random number to be used in one occasion (it must be unique for every iteration)
  I.cache.NONCE = Date.now();
  console.log(` #### Nonce to use : ${I.cache.NONCE}`);
});

// Scenario #1 - Testing OIDC flow with NIH credentials
Scenario('Initiate the OIDC Client flow with NIH credentials to obtain the OAuth authorization code @manual', ifInteractive(
  async ({ I }) => {
    const result = await interactive(`
            1. Using the "client id" provided, paste the following URL into the browser (replacing the CLIENT_ID placeholder accordingly):
                 https://${TARGET_ENVIRONMENT}/user/oauth2/authorize?redirect_uri=https://${TARGET_ENVIRONMENT}&client_id=<CLIENT_ID>&scope=openid+user+data+google_credentials&response_type=code&nonce=test-nonce-${I.cache.NONCE}
            2. Make sure you are logged in with your NIH Account.
            3. On the Consent page click on the "Yes, I authorize" button.
            4. Once the user is redirected to a new page, copy the value of the "code" parameter that shows up in the URL (this code is valid for 60 seconds).
            5. Run the following curl command with basic authentication (replacing the CODE + CLIENT_ID and CLIENT_SECRET placeholders accordingly) to obtain 3 pieces of data:
               a. Access Token
               b. ID Token
               c. Refresh token
--
            % curl --user "<CLIENT_ID>:<CLIENT_SECRET>" -X POST "https://<TARGET_ENVIRONMENT>/user/oauth2/token?grant_type=authorization_code&code=<CODE>&redirect_uri=https://${TARGET_ENVIRONMENT}/user"
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #2 - Verify Nonce
Scenario('Verify if the "ID Token" produced in the previous scenario has the correct nonce value @manual', ifInteractive(
  async ({ I }) => {
    const idToken = await requestUserInput('Please paste in your ID Token to verify the nonce: ');
    const result = await interactive(`
            1. [Automated] Compare nonces:
               This is the nonce from the previous scenario: ${I.cache.NONCE}
               And this is the nonce obtained after decoding your ID Token: ${findNonce(idToken)}
               Result: ${I.cache.NONCE === findNonce(idToken)}
            2. Confirm if the numbers match.
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #3 - Run PreSigned URL with access token obtained through the OIDC flow
Scenario('Perform PreSigned URL test @manual', ifInteractive(
  async ({ I, fence }) => {
    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide the ACCESS_TOKEN obtained through the OIDC bootstrapping: ');
    const httpResp = await I.sendGetRequest(
      `https://${TARGET_ENVIRONMENT}/index/index`,
    ).then(( res ) => new Gen3Response(res));

    const { records } = httpResp.body;

    const signedUrlRes = await fence.do.createSignedUrl(
      records[0].did,
      [],
      assembleCustomHeaders(I.cache.ACCESS_TOKEN),
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
