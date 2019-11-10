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

function fetchDIDLists(I, ACCESS_TOKEN) {
    // Only assemble the didList if the list hasn't been initialized
    return new Promise(async(resolve) => {
	if (!I.didList) {
	    const http_resp = await I.sendGetRequest(
		`${TARGET_ENVIRONMENT}/user/user`,
		{ Authorization: `bearer ${ACCESS_TOKEN}` }
	    ).then(res => new Gen3Response(res));

	    project_access_list = http_resp.body.project_access;

	    // initialize dict of accessible DIDs
	    _200files = {};
	    // initialize dict of blocked DIDs
	    _401files = {};

	    // adding record DIDs to their corresponding ACL key
	    // ( I.records is created in BeforeSuite() )
	    I.records.forEach(record => {
		// console.log('ACLs for ' + record['did'] + ' - ' + record['acl']);
		// Filtering accessible DIDs by checking if the record acl is in the project access list
		let accessible_did = record['acl'].filter(acl => {
		    return project_access_list.hasOwnProperty(acl);
		});
		if (accessible_did.length > 0) {
		    _200files[record['did']] = { "urls": record['urls'], "md5": record['md5'] };
		} else {
		    _401files[record['did']] = { "urls": record['urls'], "md5": record['md5'] };
		}
	    });

//	    console.log('http 200 files: ' + JSON.stringify(_200files));
//	    console.log('http 401 files: ' + JSON.stringify(_401files));

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

function performPreSignedURLTest(cloud_provider, type_of_test) {
    Scenario(`Perform ${cloud_provider} PreSigned URL ${type_of_test} test against DID @manual`, ifInteractive(
	async(I, fence) => {
	    // Prompt user for ACCESS_TOKEN
	    let ACCESS_TOKEN = await requestUserInput("Please paste in the ACCESS_TOKEN to verify your projects' access list: ");
	    // Obtain project access list to determine which files(DIDs) the user can access
	    // two lists: http 200 files and http 401 files
	    const {_200files, _401files} = await fetchDIDLists(I, ACCESS_TOKEN);

	    // positive: _200files | negative: _401files
	    let list_of_DIDs = type_of_test == "positive" ? _200files : _401files;
	    // AWS: s3:// | Google: gs://
	    let preSignedURL_prefix = cloud_provider == "AWS" ? 's3://' : 'gs://';

	    console.log('list_of_DIDs: ' + JSON.stringify(list_of_DIDs));

	    let filteredDIDs = Object.keys(list_of_DIDs).reduce(function (filtered, key) {
		list_of_DIDs[key]['urls'].forEach(url => {
		    console.log('url.startsWith(...): ' + url.startsWith(preSignedURL_prefix));
		    if (url.startsWith(preSignedURL_prefix)) filtered[key] = list_of_DIDs[key];
		});
		return filtered;
	    }, {});

	    console.log('filtered: ' + JSON.stringify(filteredDIDs));
	    // Must have at least one sample to conduct this test
	    let selected_did = Object.keys(filteredDIDs)[0];
	    // PreSignedURL request
	    const signedUrlRes = await fence.do.createSignedUrl(
		`${selected_did}`,
		[],
		assembleCustomHeaders(ACCESS_TOKEN)
	    );

	    // TODO: Run `wget` with PreSignedURL and check if md5 matches the record['md5']

	    let verification_message = type_of_test == "positive" ? `
                a. The HTTP response code is Ok/200.
                b. The response contain valid URLs to the files stored in AWS S3 or GCP Buckets.` : `
	        a. The HTTP response code is 401.
                b. The response contains a Fence error message.`;

	    const result = await interactive (`
              1. [Automated] Selected DID [${selected_did}] to perform a ${type_of_test} ${cloud_provider} PreSigned URL test.
              2. [Automated] Executed an HTTP GET request (using the ACCESS_TOKEN provided).
              3. Verify if:${verification_message}

              Manual verification:
                HTTP Code: ${signedUrlRes.status}
                RESPONSE: ${JSON.stringify(signedUrlRes.body) || signedUrlRes.parsedFenceError}
            `);
	    expect(result.didPass, result.details).to.be.true;
	}
    ));
}

BeforeSuite(async(I) => {
    console.log('Setting up dependencies...');
    // random number to be used in one occasion (it must be unique for every iteration)
    // making this data accessible in all scenarios through the actor's memory (the "I" object)
    I.NONCE = Date.now();

    // Fetching public list of DIDs
    const http_resp = await I.sendGetRequest(
	`${TARGET_ENVIRONMENT}/index/index`
    ).then(res => new Gen3Response(res));

    records = http_resp.body.records;
    I.records = records;
});

/* ############################### */
/* Scenarios with Google account   */
/* ############################### */

// Scenario #1 - Testing OIDC flow with Google credentials
Scenario('Initiate the OIDC Client flow with Google credentials to obtain the OAuth authorization code @manual', ifInteractive(
    async(I) => {
        const result = await interactive (printOIDCFlowInstructions(I, "Google"));
	expect(result.didPass, result.details).to.be.true;
    }
));

// Scenario #2 - Verify Nonce
runVerifyNonceScenario();

// Scenario #3 - Controlled Access Data - Google PreSignedURL test against DID the user can't access
// TODO: internalstaging.datastage is missing a sample file for this scenario
performPreSignedURLTest("Google", "negative");

// Scenario #4 - Controlled Access Data - Google PreSignedURL test against DID the user can access
performPreSignedURLTest("Google", "positive");

// Scenario #5 - Controlled Access Data - Google PreSignedURL test against DID the user can't access
// TODO: internalstaging.datastage is missing a sample file for this scenario
performPreSignedURLTest("AWS", "negative");

// Scenario #6 - Controlled Access Data - Google PreSignedURL test against DID the user can access
performPreSignedURLTest("AWS", "positive");

/* ############################### */
/* Scenarios with NIH account   */
/* ############################### */

console.log('Click on the logout button so you can log back in with your NIH account.');

// Scenario #7 - Starting the OIDC flow again with NIH credentials
Scenario('Initiate the OIDC Client flow with NIH credentials to obtain the OAuth authorization code @manual', ifInteractive(
    async(I) => {
        const result = await interactive (printOIDCFlowInstructions(I, "NIH"));
	expect(result.didPass, result.details).to.be.true;
    }
));

// Scenario #8 - Verify Nonce again
runVerifyNonceScenario();

// Scenario #9 - Controlled Access Data - Google PreSignedURL test against DID the user can't access
performPreSignedURLTest("Google", "negative");

// Scenario #10 - Controlled Access Data - Google PreSignedURL test against DID the user can access
// TODO: internalstaging.datastage is missing a sample file for this scenario
performPreSignedURLTest("Google", "positive");

// Scenario #11 - Controlled Access Data - Google PreSignedURL test against DID the user can't access
performPreSignedURLTest("AWS", "negative");

// Scenario #12 - Controlled Access Data - Google PreSignedURL test against DID the user can access
performPreSignedURLTest("AWS", "positive");
