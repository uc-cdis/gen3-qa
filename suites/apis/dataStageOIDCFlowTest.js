/*
 This test plan has a few pre-requisites:
 1. Google & NIH accounts.
 2. Access to the target commons environment (corresponding user entries in users.yaml - Google credential with "admin" access).
 3. Existing files (successfully uploaded and indexed). A portion of these files must have a proper ACL configuration for both Google & NIH accounts, some files need to have an ACL versus Project Access mismatch to test "Access Denied" scenarios.
 4. Client ID provided by developers (required for OIDC bootstrapping).
 5. Client Secret provided by developers (Used for basic auth to obtain tokens and to refresh the access token).
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

function printOIDCFlowInstructions(I, account_type) {
    return `
            1. Using the "client id" provided, paste the following URL into the browser (replacing the CLIENT_ID placeholder accordingly):
                 "${TARGET_ENVIRONMENT}/user/oauth2/authorize?redirect_uri=${TARGET_ENVIRONMENT}/user&client_id=\$\{CLIENT_ID\}&scope=openid+user+data+google_credentials&response_type=code&nonce=test-nonce-${I.NONCE}"
            2. Make sure you are logged in with your ${account_type} Account.
            2. On the Consent page click on the "Yes, I authorize" button.
            3. Once the user is redirected to a new page, copy the value of the "code" parameter that shows up in the URL (this code is valid for 60 seconds).
            4. Run the following curl command with basic authentication (replacing the CODE + CLIENT_ID and CLIENT_SECRET placeholders accordingly) to obtain 3 pieces of data:
               a. Access Token
               b. ID Token
               c. Refresh token
--
            % curl --user "\$\{CLIENT_ID\}:\$\{CLIENT_SECRET\}" -X POST "${TARGET_ENVIRONMENT}/user/oauth2/token?grant_type=authorization_code&code=\$\{CODE\}&redirect_uri=${hostname}/user
            `;
}

function runVerifyNonceScenario() {
    Scenario('Verify if the "ID Token" produced in the previous scenario has the correct nonce value @manual', ifInteractive(
	async(I) => {
	    let id_token = await requestUserInput("Please paste in your ID Token to verify the nonce: ");
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
}

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

function assembleCustomHeaders(ACCESS_TOKEN) {
    // Add ACCESS_TOKEN to custom headers
    return {
	Accept: 'application/json',
	Authorization: `bearer ${ACCESS_TOKEN}`,
	'Content-Type': 'application/json',
    };
}

function bootstrapDIDLists(I, ACCESS_TOKEN) {
    // Only assemble the didList if the list hasn't been initialized
    return new Promise(async(resolve) => {
	if (!I.didList) {
	    const http_resp = await I.sendGetRequest(
		`${TARGET_ENVIRONMENT}/user/user`,
		{ Authorization: `bearer ${ACCESS_TOKEN}` }
	    ).then(res => new Gen3Response(res));

	    project_access_list = http_resp.body.project_access;

	    // initialize list of accessible DIDs
	    _200files = [];
	    // initialize list of blocked DIDs
	    _401files = [];

	    // adding record DIDs to their corresponding ACL key
	    I.records.forEach(record => {
		// console.log('ACLs for ' + record['did'] + ' - ' + record['acl']);
		// Filtering accessible DIDs by checking if the record acl is in the project access list
		let accessible_did = record['acl'].filter(acl => {
		    return project_access_list.hasOwnProperty(acl);
		});
		if (accessible_did.length > 0) {
		    _200files.push(record['did']);
		} else {
		    _401files.push(record['did']);
		}
	    });

	    console.log('http 200 files: ' + _200files);
	    console.log('http 401 files: ' + _401files);

	    I.didList = {};
	    I.didList['accessGrantedFiles'] = _200files;
	    I.didList['accessDeniedFiles'] = _401files;
	}
	resolve({
	    _200files: I.didList.accessGrantedFiles,
	    _401files: I.didList.accessDeniedFiles
	});
    });
}

BeforeSuite(async(I) => {
    console.log('Setting up dependencies...');
    // random number to be used in one occasion (it must be unique for every iteration)
    // making this data accessible in all scenarios through the actor's memory (the "I" object)
    I.NONCE = Date.now();
    const http_resp = await I.sendGetRequest(
	`${TARGET_ENVIRONMENT}/index/index`
    ).then(res => new Gen3Response(res));

    records = http_resp.body.records;
    I.records = records;
});

/* ################# */
/* Scenarios - BEGIN */
/* ################# */

// Scenario #1 - Testing with Google credentials
Scenario('Initiate the OIDC Client flow with Google credentials to obtain the OAuth authorization code @manual', ifInteractive(
    async(I) => {
        const result = await interactive (printOIDCFlowInstructions(I, "Google"));
	expect(result.didPass, result.details).to.be.true;
    }
));

// Scenario #2 - Verify Nonce
runVerifyNonceScenario();

// Scenario #3  - Perform PreSignedURL test with Google account (should succeed)
Scenario('Perform PreSigned URL tests with Google Account against the DIDs (Digital IDs) of the indexed records @manual', ifInteractive(
    async(I, fence) => {
	// Prompt user for ACCESS_TOKEN
	let ACCESS_TOKEN = await requestUserInput("Please paste in the ACCESS_TOKEN obtained in the previous scenario: ");

	// Pick one of the dids from the list
	let selected_did = I.records[0]['did'];
	// e.g., dg.4503/00000dbc-ec18-4aac-a8c4-d2988e7e196d

	// PreSignedURL request
	const signedUrlRes = await fence.do.createSignedUrl(
	    `${selected_did}`,
	    [],
	    assembleCustomHeaders(ACCESS_TOKEN)
	);

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

// Scenario #4 - Starting the OIDC flow again with NIH credentials
Scenario('Initiate the OIDC Client flow with NIH credentials to obtain the OAuth authorization code @manual', ifInteractive(
    async(I) => {
        const result = await interactive (printOIDCFlowInstructions(I, "NIH"));
	expect(result.didPass, result.details).to.be.true;
    }
));

// Scenario #5 - Verify Nonce again
runVerifyNonceScenario();

// Scenario #6 - Controlled Access Data - Perform PreSignedURL test against DID the user can't access
Scenario('Access Denied: Perform PreSigned URL tests against a DID the user cannot access @mehtest', ifInteractive(
    async(I, fence) => {
	// Prompt user for ACCESS_TOKEN
	let ACCESS_TOKEN = await requestUserInput("Please paste in the ACCESS_TOKEN to verify your projects' access list: ");
	// Obtain project access list to determine which files(DIDs) the user can access
	// two lists: http 200 files and http 401 files
	const {_200files, _401files} = await bootstrapDIDLists(I, ACCESS_TOKEN);

	// pick a blocked file for the negative test
	let selected_did = _401files[0];

	// TODO: Cover both authorized and unauthorized scenarios (different dids)
	// PreSignedURL request
	const signedUrlRes = await fence.do.createSignedUrl(
	    `${selected_did}`,
	    [],
	    assembleCustomHeaders(ACCESS_TOKEN)
	);

	const result = await interactive (`
            1. [Automated] Select DID which cannot be accessed by the user: [${selected_did}] to perform PreSigned URL test.
            2. [Automated] Executed an HTTP GET request (using the ACCESS_TOKEN provided).
            3. Verify if:
               a. The HTTP response code is 401.
               b. The response contains a Fence error message.

            Manual verification:
            HTTP Code: ${signedUrlRes.status}
            RESPONSE: ${JSON.stringify(signedUrlRes.body) || signedUrlRes.parsedFenceError}
            `);
	expect(result.didPass, result.details).to.be.true;
    }
));

// Scenario #7 - Controlled Access Data - Perform PreSignedURL test against DID the user can't access
Scenario('Access Granted: Perform PreSigned URL tests against a DID the user can access @mehtest', ifInteractive(
    async(I, fence) => {
	// Prompt user for ACCESS_TOKEN
	let ACCESS_TOKEN = await requestUserInput("Please paste in the ACCESS_TOKEN to verify your projects' access list: ");
	const {_200files, _401files} = await bootstrapDIDLists(I, ACCESS_TOKEN);

	// pick an accessible file for the positive test
	let selected_did = _200files[0];

	// TODO: Cover both authorized and unauthorized scenarios (different dids)
	// PreSignedURL request
	const signedUrlRes = await fence.do.createSignedUrl(
	    `${selected_did}`,
	    [],
	    assembleCustomHeaders(ACCESS_TOKEN)
	);

	const result = await interactive (`
            1. [Automated] Select DID which can be accessed by the user: [${selected_did}] to perform PreSigned URL test.
            2. [Automated] Executed an HTTP GET request (using the ACCESS_TOKEN provided).
            3. Verify if:
               a. The HTTP response code is 200.
               b. The response contain valid URLs to the files stored in AWS S3 or GCP Buckets.

            Manual verification:
            HTTP Code: ${signedUrlRes.status}
            RESPONSE: ${JSON.stringify(signedUrlRes.body) || signedUrlRes.parsedFenceError}
            `);
	expect(result.didPass, result.details).to.be.true;
    }
));
