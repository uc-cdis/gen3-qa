// Feature # 2 in the sequence of testing
// This test plan has a few pre-requisites: Check prereq.md for more details.
Feature('2. Service accounts registration - DCF Staging testing for release sign off - https://ctds-planx.atlassian.net/browse/PXP-3836');

// To be executed with GEN3_SKIP_PROJ_SETUP=true -- No need to set up program / retrieve access token, etc.

const fenceProps = require('../../../services/apis/fence/fenceProps.js');
const user = require('../../../utils/user.js');
const chai = require('chai');
const {interactive, ifInteractive} = require('../../../utils/interactive.js');
const { Gen3Response, getAccessTokenFromExecutableTest, getAccessTokenHeader, requestUserInput } = require('../../../utils/apiUtil');
const expect = chai.expect;

// Test elaborated for nci-crdc but it can be reused in other projects
const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'nci-crdc-staging.datacommons.io';

function collectUserInput(I) {
    return new Promise(async(resolve) => {
	// Collect all the user input just once and reuse this data in the next scenarios
	if (!I.cache) {
	    let ACCESS_TOKEN = await requestUserInput("Please provide your ACCESS_TOKEN: ");
	    // getAccessTokenFromExecutableTest(I); // Something wrong with the audience here...
	    I.cache = {
 		// set a userAcct obj with an "accessTokenHeader" property to use Gen3-qa's Fence testing API
		userAcct: { accessTokenHeader: getAccessTokenHeader(ACCESS_TOKEN) },
		// set a googleProject obj with "serviceAccountEmail" and "id" to use Gen3-qa's Fence testing API
		googleProject: {
		    // e.g., dcf-testing-sa@dcf-testing-staging.iam.gserviceaccount.com
		    serviceAccountEmail: await requestUserInput('Please provide the service account email address:'),
		    // e.g., dcf-testing-staging
		    id: await requestUserInput('Please provide the id of the Google project:')
		}
	    };
	    // TODO: Should we allow the user to input multiple project_access names (ACLs/DbGap prj names) ?
	    // e.g., phs000123
	    let prj = await requestUserInput('Please provide at least one project name to grant project access:');
	    I.cache.projectAccessList = [prj];
	}
	resolve(I.cache);
    });
}

function performSvcAcctRegistrationTest(type_of_test, test_instructions) {
    Scenario(`Register Google IAM Service Account: ${type_of_test} @manual`, ifInteractive(
	async(I, fence) => {
	    await collectUserInput(I);

	    // console.log('access token: ' + I.cache.ACCESS_TOKEN);
	    const http_resp = await fence.do.registerGoogleServiceAccount(
		I.cache.userAcct,
		type_of_test != 'invalid_svc_account' ? I.cache.googleProject : { serviceAccountEmail: 'whatever@invalid.iam.gserviceaccount.com', id: I.cache.googleProject.id },
		type_of_test != 'invalid_prj_access' ? I.cache.projectAccessList : ['phs666DoesNotExist'],
		null,
		type_of_test != 'dry_run_registration' ? false : true
	    );

	    const result = await interactive (`
              1. [Automated] Send a HTTP POST request with the NIH user's ACCESS TOKEN to register a service account:
              HTTP POST request to: https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.registerGoogleServiceAccount}${type_of_test != 'dry_run_registration' ? '' : '/_dry_run'}
              Manual verification:
                Response status: ${http_resp.status} // Expect a HTTP ${test_instructions.expected_status}
                Response data: ${JSON.stringify(http_resp.body) || http_resp.parsedFenceError} 
                // Expect ${test_instructions.expected_response}
            `);
	    expect(result.didPass, result.details).to.be.true;
	}
    ));
}

function performSvcAcctUpdateTest(type_of_test, test_instructions) {
  Scenario(`Update existing service account @manual`, ifInteractive(
    async(I, fence) => {
	await collectUserInput(I);
	// patch existing svc acct to remove project access
	const http_resp = await fence.do.updateGoogleServiceAccount(
	    I.cache.userAcct,
	    type_of_test != 'patch_unregistered_acc' ? I.cache.googleProject.serviceAccountEmail : 'whatever@invalid.iam.gserviceaccount.com',
	    [],
	    type_of_test != 'dry_run' ? false : true
	);
	const result = await interactive (`
              1. [Automated] Send a HTTP PATCH request with the NIH user's ACCESS TOKEN to update the project access for svc acct: ${I.cache.googleProject.serviceAccountEmail}.
              HTTP PATCH request to: https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.updateGoogleServiceAccount}${type_of_test != 'dry_run' ? '' : '/_dry_run'}/${type_of_test != 'patch_unregistered_acc' ? I.cache.googleProject.serviceAccountEmail : 'whatever@invalid.iam.gserviceaccount.com'}
              Manual verification:
                Response status: ${http_resp.status} // Expect a HTTP ${test_instructions.expected_status}
                Response data: ${JSON.stringify(http_resp.body) || http_resp.parsedFenceError}
                // Expect ${test_instructions.expected_response}
            `);
	expect(result.didPass, result.details).to.be.true;
    }
  ));
}

BeforeSuite(async(I) => {
    console.log('Setting up dependencies...');
    I.TARGET_ENVIRONMENT = TARGET_ENVIRONMENT;
});

let svc_acct_registration_tests_map = {
    valid_svc_account: {
	expected_status: 200,
	expected_response: 'service account registration details (service_account_email, google_project_id and project_access)'
    },
    invalid_svc_account: {
	expected_status: 400,
	expected_response: 'the "Either the service account doesn\'t exist or we were unable to retrieve its Policy" message'
    },
    invalid_prj_access: {
	expected_status: 400,
	expected_response: 'a "project_not_found" message - http 404'
    },
    existing_svc_account: {
	expected_status: 400,
	expected_response: 'a "Conflict" message - http 409'
    },
    dry_run_registration: {
	expected_status: 400,
	expected_response: 'a "Service Account already registered" message'
    }
};

// Scenarios #1/2/3/4/5 - Register an IAM service account from the GCP "customer" project owned by the Google account linked in Executable Test Plan #1 (linkAccountsTest.js)
for (const [type_of_test, test_instructions] of Object.entries(svc_acct_registration_tests_map)) {
    performSvcAcctRegistrationTest(type_of_test, test_instructions);
}

// Scenario #6 - Get details from the service account that has been successfully registered
Scenario(`Get details from registered service account @manual`, ifInteractive(
    async(I, fence) => {
	await collectUserInput(I);

	const http_resp = await fence.do.getGoogleServiceAccounts(I.cache.userAcct, [ I.cache.googleProject.id ]);

	const result = await interactive (`
              1. [Automated] Send a HTTP GET request with the NIH user's ACCESS TOKEN to retrieve details from the Google service account that has been registered:
              HTTP GET request to: https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.getGoogleServiceAccounts}\?google_project_ids=${I.cache.googleProject.id}
              Manual verification:
                Response status: ${http_resp.status} // Expect a HTTP 200
                Response data: ${JSON.stringify(http_resp.body) || http_resp.parsedFenceError} // Expect a "service_accounts" list containing all the accounts registered against that project
            `);
	expect(result.didPass, result.details).to.be.true;
    }
));

// Scenario #7 - Get id of the account that is monitoring the "customer" Google Cloud IAM space within a given project
Scenario(`Get the ID of the GCP monitor ("fence-service" account) @manual`, ifInteractive(
    async(I, fence) => {
	let ACCESS_TOKEN = !I.cache ? await requestUserInput("Please provide your ACCESS_TOKEN: ") : I.cache.ACCESS_TOKEN;

	const http_resp = await fence.do.getGoogleSvcAcctMonitor(I.cache.userAcct);

	const result = await interactive (`
              1. [Automated] Send a HTTP GET request with the NIH user's ACCESS TOKEN to retrieve the ID of the fence-service monitor account:
              HTTP GET request to: https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.getGoogleSvcAcctMonitor}
              Manual verification:
                Response status: ${http_resp.status} // Expect a HTTP 200
                Response data: ${JSON.stringify(http_resp.body) || http_resp.parsedFenceError}

                // Expect the ID / email address of the fence-service account
            `);
	expect(result.didPass, result.details).to.be.true;
    }
));

let svc_acct_update_tests_map = {
    regular_patch: {
	expected_status: 204,
	expected_response: '"undefined" (HTTP 204 = No content)'
    },
    patch_unregistered_acc: {
	expected_status: 404,
	expected_response: 'a "Could not find a registered service account from given email" message'
    },
    dry_run: {
	expected_status: 200,
	expected_response: '"success": true'
    }
}

// Scenario #8/#9/#10 - Updating existing service account, unregistered account & dry run
for (const [type_of_test, test_instructions] of Object.entries(svc_acct_update_tests_map)) {
    performSvcAcctUpdateTest(type_of_test, test_instructions);
}

// Scenario #11 - Get billing projects
Scenario(`Get billing GCP projects @manual`, ifInteractive(
    async(I, fence) => {
	let ACCESS_TOKEN = !I.cache ? await requestUserInput("Please provide your ACCESS_TOKEN: ") : I.cache.ACCESS_TOKEN;

	const http_resp = await fence.do.getGoogleBillingProjects(I.cache.userAcct);

	const result = await interactive (`
              1. [Automated] Send a HTTP GET request with the NIH user's ACCESS TOKEN to retrieve the list of billing projects associated with the Google Account that was linked:
              HTTP GET request to: https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.getGoogleBillingProjects}
              Manual verification:
                Response status: ${http_resp.status} // Expect a HTTP 200
                Response data: ${JSON.stringify(http_resp.body) || http_resp.parsedFenceError}

                // Expect json payload containing "project_id": null
            `);
	expect(result.didPass, result.details).to.be.true;
    }
));

// Scenario #12 - Delete Google service account that has been registered in previous steps
Scenario(`Delete existing service account @manual`, ifInteractive(
  async(I, fence) => {
    await collectUserInput(I);
    // patch existing svc acct to remove project access
    const http_resp = await fence.do.deleteGoogleServiceAccount(
      I.cache.userAcct,
      I.cache.googleProject.serviceAccountEmail
   );
   const result = await interactive (`
              1. [Automated] Send a HTTP DELETE request with the NIH user's ACCESS TOKEN to delete the svc acct: ${I.cache.googleProject.serviceAccountEmail}.
              HTTP DELETE request to: https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.deleteGoogleServiceAccount}/${I.cache.googleProject.serviceAccountEmail}
              Manual verification:
                Response status: ${http_resp.status} // Expect a HTTP 200
                Response data: ${JSON.stringify(http_resp.body) || http_resp.parsedFenceError}
                // Expect a "Successfully delete service account" message
            `);
      expect(result.didPass, result.details).to.be.true;
  }
));

// Scenario #13 - Register account again to support next steps
performSvcAcctRegistrationTest('valid_svc_account', {
    expected_status: 200,
    expected_response: 'service account registration details (service_account_email, google_project_id and project_access)'
});
