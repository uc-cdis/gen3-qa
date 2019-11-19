//  This test plan has a few pre-requisites: Check prereq.md for more details.
Feature('Linking accounts - DCF Staging testing for release sign off - https://ctds-planx.atlassian.net/browse/PXP-3836');

// To be executed with GEN3_SKIP_PROJ_SETUP=true -- No need to set up program / retrieve access token, etc.

const readline = require('readline');
const user = require('../../../utils/user.js');
const chai = require('chai');
const {interactive, ifInteractive} = require('../../../utils/interactive.js');
const { Gen3Response, getAccessTokenFromApiKey } = require('../../../utils/apiUtil');
const expect = chai.expect;

// Test elaborated for nci-crdc but it can be reused in other projects
const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'nci-crdc-staging.datacommons.io';

function getCurrTimePlus(hours) {
    return new Date().getHours() + hours;
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

// Scenario #1 - Verifying NIH access and permissions (project access)
Scenario(`Login to https://${TARGET_ENVIRONMENT} and check the Project Access list under the Profile page @manual`, ifInteractive(
    async(I, fence) => {
	const result = await interactive (`
              1. Go to https://${TARGET_ENVIRONMENT}
              2. Login with NIH account
              3. Check if the Profile page contains projects the user can access

              e.g., The projects are usually named as "phs000178".
            `);
	expect(result.didPass, result.details).to.be.true;
    }
));

// Scenario #2 - Link Google Service Account from the "customer" GCP account
// Note: Cannot leverage the ${user.mainAcct.accessToken} while working on an internal staging env. (i.e., no access to the underlying admin vm, hence, using API Key + Fence HTTP API to retrieve the Access Token)
Scenario(`Use API Key to obtain Access Token and link Google identity to NIH user, set expiration parameter and unlink it @manual`, ifInteractive(
    async(I, fence) => {
	// Prompt user for API_KEY to automatically obtain the ACCESS TOKEN
	let API_KEY = await requestUserInput(`
              1. Navigate to the "Profile" page on https://${TARGET_ENVIRONMENT} and click on "Create API key".
              2. Download the "credentials.json" file, copy the value of the "api_key" parameter and paste it here:
        `);
	let ACCESS_TOKEN = await getAccessTokenFromApiKey(API_KEY, TARGET_ENVIRONMENT);
	console.log('access token: ' + ACCESS_TOKEN);

	const result = await interactive (`
              1. Copy and paste the following URL into your browser:
                 https://${TARGET_ENVIRONMENT}/user/link/google?redirect=/login
              2. Provide the credentials of the Google account that owns the "Customer" GCP account
                 This Google account will be linked to the NIH account within this Gen3 environment.
              3. [Automated] Send a HTTP PATCH request with the NIH user's ACCESS TOKEN to extend the expiration date of this Google account access (?expires_in=<current epoch time + 2 hours>):
                 curl -v -X PATCH -H "Authorization: Bearer \$\{ACCESS_TOKEN\}" https://${TARGET_ENVIRONMENT}/user/link/google\?expires_in\=${getCurrTimePlus(2)}

              Expect a < HTTP/1.1 200 OK response containing the new "exp" date.
            `);
	expect(result.didPass, result.details).to.be.true;
    }
));



