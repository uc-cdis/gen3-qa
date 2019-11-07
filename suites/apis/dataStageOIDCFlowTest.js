/*
 This test plan has a few pre-requisites:
 1. Access to https://internalstaging.datastage.io (corresponding user entries in users.yaml).
 2. Client ID provided by developers (required for OIDC bootstrapping).
 3. Client secret provided by developers (Used for basic auth to obtain tokens and to refresh the access token).
*/
Feature('Testing OIDC flow and pre-signed URL to check tokens - https://ctds-planx.atlassian.net/browse/PXP-4649');

// To be executed with GEN3_SKIP_PROJ_SETUP=true -- No need to set up program / retrieve access token, etc.

const readline = require("readline");
const user = require('../../utils/user.js');
const chai = require('chai');
const {interactive, ifInteractive} = require('../../utils/interactive.js');
const { Gen3Response } = require('../../utils/apiUtil');
const expect = chai.expect;

// Test elaborated for DataSTAGE but it can be reused in other projects
const hostname = process.env.HOSTNAME || 'internalstaging.datastage.io';
const TARGET_ENVIRONMENT = `https://${hostname}`

// TODO: Turn this into a more generic JS object and move it to utils/interactive.js
function requestUserInput(question_text) {
    return new Promise((resolve) => {
	let rl = readline.createInterface({
	    input: process.stdin,
	    output: process.stdout
	});
       rl.question(question_text, (user_input) => {
	  rl.close();
	  resolve(user_input);
       });
    });
}

function findNonce(id_token) {
    console.log('WTF is going on here? ' + id_token);
    data = id_token.split('.'); // [0] headers, [1] payload, [2] whatever
    payload = data[1];
    console.log('payload? ' + payload);
    padding = "=".repeat(4 - payload.length % 4);
    decoded_data = Buffer.from((payload + padding), 'base64').toString();
    console.log('decoded_data? ' + decoded_data);
    // If the decoded data doesn't contain a nonce, that means the refresh token has expired
    nonce_str = JSON.parse(decoded_data)['nonce']; // output: test-nounce-<number>
    console.log('nonce_str? ' + nonce_str);
    return parseInt(nonce_str.split('-')[2]);
}

BeforeSuite((I) => {
    console.log('Setting up dependencies...');
    // random number to be used in one occasion (it must be unique for every iteration)
    // making this variable accessible in all scenarios through the "I"
    I.NONCE = Date.now();
});

Scenario('Initiate the OIDC Client flow to obtain the OAuth authorization code @manual', ifInteractive(
    async(I) => {
        const result = await interactive (`
            1. Using the "client id" provided, paste the following URL into the browser (replacing the CLIENT_ID placeholder accordingly):
                 "${TARGET_ENVIRONMENT}/user/oauth2/authorize?redirect_uri=${TARGET_ENVIRONMENT}/user&client_id=\$\{CLIENT_ID\}&scope=openid+user+data+google_credentials&response_type=code&nonce=test-nonce-${I.NONCE}"
            2. On the Consent page click on the "Yes, I authorize" button.
            3. Once the user is redirected to a new page, copy the value of the "code" parameter that shows up in the URL (this code is valid for 60 seconds).
            4. Run the following curl command with basic authentication (replacing the CODE + CLIENT_ID and CLIENT_SECRET placeholders accordingly) to obtain 3 pieces of data:
               a. Access Token
               b. ID Token
               c. Refresh token
--
            % curl --user "\$\{CLIENT_ID\}:\$\{CLIENT_SECRET\}" -X POST "${TARGET_ENVIRONMENT}/user/oauth2/token?grant_type=authorization_code&code=\$\{CODE\}&redirect_uri=${hostname}/user
            `);
	expect(result.didPass, result.details).to.be.true;
    }
));

Scenario('Verify if the "ID Token" produced in the previous scenario has the correct nonce value @manual', ifInteractive(
    async(I) => {
	let id_token = await requestUserInput("Please paste in your ID Token to verify the nonce: ");
	console.log('here it is: ' + id_token);
        const result = await interactive (`
            1. [Automated] Compare nonces:
               This is the nonce from the previous scenario: ${I.NONCE}
               And this is the nonce obtained after decoding your ID Token: ${findNonce(id_token)}
               Result: ${ I.NONCE == findNonce(id_token) }
            2. Confirm if the numbers match.
            `);
        expect(result.didPass, result.details).to.be.true;
    }
));

Scenario('Perform PreSigned URL tests against the data IDs of the indexed records @manual', ifInteractive(
    async(I, fence) => {
	let did_options = new Array();
	const http_resp = await I.sendGetRequest(
	    `${TARGET_ENVIRONMENT}/index/index`
	).then(res => new Gen3Response(res));

        records = http_resp.body.records;
	// Arbitrarily adding the first 10 dids to the list
	for (i = 0; i < 10; i++) {
	    did_options.push(records[i]['did']);
	}

	// Sampling: Randomly selecting one of the dids from the list
	let selected_did = did_options[Math.floor(Math.random()*did_options.length)];
	// e.g., dg.4503/00000dbc-ec18-4aac-a8c4-d2988e7e196d

	// Prompt user for ACCESS_TOKEN
	let ACCESS_TOKEN = await requestUserInput("Please paste in the ACCESS_TOKEN obtained in the previous scenario: ");

	// Add ACCESS_TOKEN to custom headers
	const CUSTOM_HEADERS = {
	    Accept: 'application/json',
	    Authorization: `bearer ${ACCESS_TOKEN}`,
	    'Content-Type': 'application/json',
	};

	// TODO: Cover both authorized and unauthorized scenarios (different dids)
	// PreSignedURL request
	const signedUrlRes = await fence.do.createSignedUrl(
	    `${selected_did}`,
	    [],
	    CUSTOM_HEADERS);

	const result = await interactive (`
            1. [Automated] Randomly selected record ID [${selected_did}] to perform PreSigned URL test.
            2. [Automated] Executed an HTTP GET request (using the ACCESS_TOKEN provided: ${ACCESS_TOKEN}).
            3. Verify if:
               a. The HTTP response code is Ok/200.
               b. The response contain valid URLs to the files stored in AWS S3 or GCP Buckets.

            Manual verification:
            HTTP Code: ${signedUrlRes.status}
            RESPONSE: ${JSON.stringify(signedUrlRes.body) || signedUrlRes.parsedFenceError}
            `);
	expect(result.didPass, result.details).to.be.true;
    }
));
