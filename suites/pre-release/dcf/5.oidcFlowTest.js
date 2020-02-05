/*eslint-disable */
// Feature # 5 in the sequence of testing
// This test plan has a few pre-requisites: Check prereq.md for more details.
Feature('1. OIDC Flow - DCF Staging testing for release sign off - https://ctds-planx.atlassian.net/browse/PXP-3836');

// To be executed with GEN3_SKIP_PROJ_SETUP=true -- No need to set up program / retrieve access token, etc.

const fenceProps = require('../../../services/apis/fence/fenceProps.js');
const user = require('../../../utils/user.js');
const chai = require('chai');
const {interactive, ifInteractive} = require('../../../utils/interactive.js');
const { Gen3Response, getAccessTokenFromExecutableTest, getAccessTokenHeader, requestUserInput } = require('../../../utils/apiUtil');
const expect = chai.expect;

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
function findNonce(id_token) {
    data = id_token.split('.'); // [0] headers, [1] payload, [2] whatever
    payload = data[1];
    padding = "=".repeat(4 - payload.length % 4);
    decoded_data = Buffer.from((payload + padding), 'base64').toString();
    // If the decoded data doesn't contain a nonce, that means the refresh token has expired
    nonce_str = JSON.parse(decoded_data)['nonce']; // output: test-nounce-<number>
    if (nonce_str == undefined) {
	return 'Could not find nonce. Make sure your id_token is not expired.';
    }
    return parseInt(nonce_str.split('-')[2]);
}

BeforeSuite(async(I) => {
    console.log('Setting up dependencies...');
    // making this data accessible in all scenarios through the actor's memory (the "I" object)
    I.cache = {};
    // random number to be used in one occasion (it must be unique for every iteration)
    I.cache.NONCE = Date.now();
});

// Scenario #1 - Testing OIDC flow with NIH credentials
Scenario('Initiate the OIDC Client flow with NIH credentials to obtain the OAuth authorization code @manual', ifInteractive(
    async(I) => {
        const result = await interactive (`
            1. Using the "client id" provided, paste the following URL into the browser (replacing the CLIENT_ID placeholder accordingly):
                 https://${TARGET_ENVIRONMENT}/user/oauth2/authorize?redirect_uri=https://${TARGET_ENVIRONMENT}/user&client_id=\$\{CLIENT_ID\}&scope=openid+user+data+google_credentials&response_type=code&nonce=test-nonce-${I.cache.NONCE}
            2. Make sure you are logged in with your NIH Account.
            3. On the Consent page click on the "Yes, I authorize" button.
            4. Once the user is redirected to a new page, copy the value of the "code" parameter that shows up in the URL (this code is valid for 60 seconds).
            5. Run the following curl command with basic authentication (replacing the CODE + CLIENT_ID and CLIENT_SECRET placeholders accordingly) to obtain 3 pieces of data:
               a. Access Token
               b. ID Token
               c. Refresh token
--
            % curl --user "\$\{CLIENT_ID\}:\$\{CLIENT_SECRET\}" -X POST "https://${TARGET_ENVIRONMENT}/user/oauth2/token?grant_type=authorization_code&code=\$\{CODE\}&redirect_uri=https://${TARGET_ENVIRONMENT}/user"
            `);
	expect(result.didPass, result.details).to.be.true;
    }
));

// Scenario #2 - Verify Nonce
Scenario('Verify if the "ID Token" produced in the previous scenario has the correct nonce value @manual', ifInteractive(
    async(I) => {
	let id_token = await requestUserInput("Please paste in your ID Token to verify the nonce: ");
        const result = await interactive (`
            1. [Automated] Compare nonces:
               This is the nonce from the previous scenario: ${I.cache.NONCE}
               And this is the nonce obtained after decoding your ID Token: ${findNonce(id_token)}
               Result: ${ I.cache.NONCE == findNonce(id_token) }
            2. Confirm if the numbers match.
            `);
        expect(result.didPass, result.details).to.be.true;
    }
));

// Scenario #3 - Run PreSigned URL with access token obtained through the OIDC flow
Scenario('Perform PreSigned URL test @manual', ifInteractive(
    async(I, fence) => {
	if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput("Please provide the ACCESS_TOKEN obtained through the OIDC bootstrapping: ");
	const http_resp = await I.sendGetRequest(
	    `https://${TARGET_ENVIRONMENT}/index/index`
	).then(res => new Gen3Response(res));

	const records = http_resp.body.records;

        const signedUrlRes = await fence.do.createSignedUrl(
	    records[0]['did'],
	    [],
	    assembleCustomHeaders(I.cache.ACCESS_TOKEN)
	);

	const result = await interactive (`
              1. [Automated] Executed a PreSigned URL request (using the ACCESS_TOKEN provided).
              2. Verify if the ACCESS TOKEN is valid.

              Manual verification:
                HTTP Code: ${signedUrlRes.status}
                RESPONSE: ${JSON.stringify(signedUrlRes.body) || signedUrlRes.parsedFenceError}
            `);
	expect(result.didPass, result.details).to.be.true;
    }
));
