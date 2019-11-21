// Feature # 2 in the sequence of testing
//  This test plan has a few pre-requisites: Check prereq.md for more details.
Feature('Service accounts registration - DCF Staging testing for release sign off - https://ctds-planx.atlassian.net/browse/PXP-3836');

// To be executed with GEN3_SKIP_PROJ_SETUP=true -- No need to set up program / retrieve access token, etc.

const user = require('../../../utils/user.js');
const chai = require('chai');
const {interactive, ifInteractive} = require('../../../utils/interactive.js');
const { Gen3Response, getAccessTokenFromExecutableTest, getAccessTokenHeader, requestUserInput } = require('../../../utils/apiUtil');
const expect = chai.expect;

// Test elaborated for nci-crdc but it can be reused in other projects
const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'nci-crdc-staging.datacommons.io';

BeforeSuite(async(I) => {
    console.log('Setting up dependencies...');
    I.TARGET_ENVIRONMENT = TARGET_ENVIRONMENT;
});

// Scenario #1 - Register an IAM service account from the GCP "customer" project owned by the Google account linked in Executable Test Plan #1 (linkAccountsTest.js)

// TODO: Wrap this around a function to parameterize both positive and negative test scenarios

Scenario(`Register Google IAM Service Account @manual`, ifInteractive(
    async(I, fence) => {
	let ACCESS_TOKEN = await getAccessTokenFromExecutableTest(I);
	console.log('access token: ' + ACCESS_TOKEN);

	// set a userAcct obj with an "accessTokenHeader" property to use Gen3-qa's Fence testing API
	let userAcct = {};
	userAcct['accessTokenHeader'] = getAccessTokenHeader(ACCESS_TOKEN);

	// set a googleProject obj with "serviceAccountEmail" and "id" properties to use Gen3-qa's Fence testing API
	let googleProject = {};
	googleProject['serviceAccountEmail'] = await requestUserInput('Please provide the service account email address:');
	googleProject['id'] = await requestUserInput('Please provide the id of the Google project:');

	// TODO: Do we want to allow the user to input multiple project_access names (ACLs/DbGap prj names) ?
	let projectAccessList = [];
	let prj = await requestUserInput('Please provide at least one project name to grant project access:');
	projectAccessList.push(prj);

	const http_resp = await fence.do.registerGoogleServiceAccount(userAcct, googleProject, projectAccessList, null);

	// TODO: Also replace the url paths in this instruction with the fenceProps.endpoints.registerGoogleServiceAccount
	// To keep using a single source of truth for URLs
	const result = await interactive (`
              1. [Automated] Send a HTTP POST request with the NIH user's ACCESS TOKEN to register a service account:
              HTTP POST request to: https://${TARGET_ENVIRONMENT}/user/google/service_accounts
              Manual verification:
                Response status: ${http_resp.status} // Expect a HTTP 200
                Response data: ${JSON.stringify(http_resp.body) || http_resp.parsedFenceError} // Expect service account registration details (service_account_email, google_project_id and project_access)
            `);
	expect(result.didPass, result.details).to.be.true;
    }
));
