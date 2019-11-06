/*
 This test plan has a few pre-requisites:
 1. Access to https://internalstaging.datastage.io (corresponding user entries in users.yaml).
 2. Client ID provided by developers (required for OIDC bootstrapping).
 3. Client secret provided by developers (Used for basic auth to obtain tokens and to refresh the access token).
*/
Feature('Testing OIDC flow, pre-signed URLs and "export to TERRA" feature - https://ctds-planx.atlassian.net/browse/PXP-4649');

// To be executed with GEN3_SKIP_PROJ_SETUP=true -- No need to set up program / retrieve access token, etc.

const readline = require("readline");
const user = require('../../utils/user.js');
const request = require('request');
const chai = require('chai');
const {interactive, ifInteractive} = require('../../utils/interactive.js');
const expect = chai.expect;

// TODO: Make this parameterizable
const TARGET_ENVIRONMENT = 'https://internalstaging.datastage.io';

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

// Perform HTTP requests
function httpGet(url) {
    return new Promise((resolve) => {
	request(url, { json: true }, function(error, response, body) {
	    if (error) {
		resolve(error);
	    }
	    console.log('http response: ' + response.statusCode);
	    resolve(body);
	});
    });
}

var findNonce = function(id_token) {
    data = id_token.split('.'); // [0] headers, [1] payload, [2] whatever
    payload = data[1];
    padding = "=".repeat(4 - payload.length % 4);
    decoded_data = Buffer.from((payload + padding), 'base64').toString();
    nonce_str = JSON.parse(decoded_data)['nonce']; // output: test-nounce-<number>
    return parseInt(nonce_str.split('-')[2]);
}

BeforeSuite((I) => {
    console.log('Setting up dependencies...');
    // random number to be used in one occasion (it must be unique for every iteration)
    // making this variable accessible in all scenarios through the "I"
    //I.NONCE = Date.now();
    I.NONCE = 1573015904301;
});

Scenario('Initiate the OIDC Client flow to obtain the OAuth authorization code @manual', ifInteractive(
    async(I) => {
        const result = await interactive (`
            1. Using the "client id" provided, paste the following URL into the browser (replacing the CLIENT_ID placeholder accordingly):
                 "${TARGET_ENVIRONMENT}/user/oauth2/authorize?redirect_uri=${TARGET_ENVIRONMENT}/user&client_id=CLIENT_ID&scope=openid+user+data+google_credentials&response_type=code&nonce=test-nonce-${I.NONCE}"
            2. On the Consent page click on the "Yes, I authorize" button.
            3. Once the user is redirected to a new page, copy the value of the "code" parameter that shows up in the URL (this code is valid for 60 seconds).
            4. Run the following curl command with basic authentication (replacing the CODE + CLIENT_ID and CLIENT_SECRET placeholders accordingly) to obtain 3 pieces of data:
               a. Access Token
               b. ID Token
               c. Refresh token
--
            % curl --user "CLIENT_ID:CLIENT_SECRET" -X POST "${TARGET_ENVIRONMENT}/user/oauth2/token?grant_type=authorization_code&code=CODE&redirect_uri=https://internalstaging.datastage.io/user
            `);
	expect(result.didPass, result.details).to.be.true;
    }
));

Scenario('Verify if the "ID Token" produced in the previous scenario has the correct nonce value @manual', ifInteractive(
    async(I) => {
	let id_token = await requestUserInput("Please paste in your ID Token to verify the nonce: ");
        const result = await interactive (`
            1. Compare nonces:
               This is the nonce from the previous scenario: ${I.NONCE}
               And this is the nonce obtained after decoding your ID Token: ${findNonce(id_token)}
            2. Confirm if the numbers match. Automated check: ${ I.NONCE == findNonce(id_token) }
            `);
        expect(result.didPass, result.details).to.be.true;
    }
));

Scenario('Perform PreSigned URL tests against the data IDs of the indexed records @lastScenario', ifInteractive(
    async(I) => {
	let did_options = new Array();
	const http_resp = await httpGet(`${TARGET_ENVIRONMENT}/index/index`);
        records = http_resp['records'];
	// Arbitrarily adding the first 10 dids to the list
	for (i = 0; i < 10; i++) {
	    did_options.push(records[i]['did']);
	}
	// Randomly selecting one of the dids from the list
	let selected_did = did_options[Math.floor(Math.random()*did_options.length)];
	// e.g., dg.4503/00000dbc-ec18-4aac-a8c4-d2988e7e196d
	const result = await interactive (`
            1. Randomly selected record ID [${selected_did}] to perform PreSigned URL tests.
            2. Run the following curl command (replacing the ACCESS_TOKEN placeholder accordingly): and verify if:
               a. The HTTP response code is Ok/200.
               b. The response contain valid links to the files stored in AWS S3 or GCP Buckets.
            % curl -v -H "Authorization: Bearer ACCESS_TOKEN" -X GET "${TARGET_ENVIRONMENT}/user/data/download/${selected_did}"
            `);
	expect(result.didPass, result.details).to.be.true;
    }
));
