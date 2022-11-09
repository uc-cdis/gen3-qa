// Feature # 2 in the sequence of testing
// This test plan has a few pre-requisites: Check prereq.md for more details.
Feature('2. Service accounts registration - DCF Staging testing for release sign off - PXP-3836');

// To be executed with GEN3_SKIP_PROJ_SETUP=true
// No need to set up program / retrieve access token, etc.

const { expect } = require('chai');
const fenceProps = require('../../../services/apis/fence/fenceProps.js');
const { interactive, ifInteractive } = require('../../../utils/interactive.js');
const {
  getAccessTokenHeader, requestUserInput,
} = require('../../../utils/apiUtil');
const oidcUtils = require('../../../utils/oidcUtils');

// Test elaborated for nci-crdc but it can be reused in other projects
const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'nci-crdc-staging.datacommons.io';

BeforeSuite(async ({ I }) => {
  console.log('Setting up dependencies...');
  I.TARGET_ENVIRONMENT = TARGET_ENVIRONMENT;
});

AfterSuite(async ({ I, fence }) => {
  console.log('Unlinking the Google user from NIH ...');
  I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');

  const unlinkResp = await fence.do.unlinkGoogleAcct(
    { accessTokenHeader: getAccessTokenHeader(I.cache.ACCESS_TOKEN) },
  );
  if (unlinkResp.status === 200) {
    console.log('The link has been deleted');
  }
});

// TODO: Use some OOP and polimorphism here instead of declaring these repetitive dict keys
const svcAcctRegistrationTestsMap = {
  validSvcAccount: {
    expectedStatus: 200,
    expectedResponse: 'service account registration details (service_account_email, google_project_id and project_access)',
  },
  invalidSvcAccount: {
    expectedStatus: 400,
    expectedResponse: 'the "Either the service account doesn\'t exist or we were unable to retrieve its Policy" message',
  },
  invalidPrjAccess: {
    expectedStatus: 400,
    expectedResponse: 'a "project_not_found" message - http 404',
  },
  existingSvcAccount: {
    expectedStatus: 400,
    expectedResponse: 'a "Conflict" message - http 409',
  },
  dryRunRegistration: {
    expectedStatus: 400,
    expectedResponse: 'a "Service Account already registered" message',
  },
};

// Scenarios #1/2/3/4/5 - Register an IAM service account from the GCP "customer" project
// owned by the Google account linked in Executable Test Plan #1 (linkAccountsTest.js)
for (const [typeOfTest, testInstructions] of Object.entries(svcAcctRegistrationTestsMap)) {
  oidcUtils.performSvcAcctRegistrationTest(typeOfTest, testInstructions);
}

// Scenario #6 - Get details from the service account that has been successfully registered
Scenario('Get details from registered service account @manual', ifInteractive(
  async ({ I, fence }) => {
    await oidcUtils.collectUserInput(I);

    const httpResp = await fence.do.getGoogleServiceAccounts(
      I.cache.userAcct,
      [I.cache.googleProject.id],
    );

    const result = await interactive(`
              1. [Automated] Send a HTTP GET request with the NIH user's ACCESS TOKEN to retrieve details from the Google service account that has been registered:
              HTTP GET request to: https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.getGoogleServiceAccounts}?google_project_ids=${I.cache.googleProject.id}
              Manual verification:
                Response status: ${httpResp.status} // Expect a HTTP 200
                Response data: ${JSON.stringify(httpResp.body) || httpResp.parsedFenceError} // Expect a "service_accounts" list containing all the accounts registered against that project
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #7 - Get id of the account that is monitoring the "customer" Google Cloud IAM space
// within a given project
Scenario('Get the ID of the GCP monitor ("fence-service" account) @manual', ifInteractive(
  async ({ I, fence }) => {
    I.cache.ACCESS_TOKEN = !I.cache ? await requestUserInput('Please provide your ACCESS_TOKEN: ') : I.cache.ACCESS_TOKEN;

    const httpResp = await fence.do.getGoogleSvcAcctMonitor(I.cache.userAcct);

    const result = await interactive(`
              1. [Automated] Send a HTTP GET request with the NIH user's ACCESS TOKEN to retrieve the ID of the fence-service monitor account:
              HTTP GET request to: https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.getGoogleSvcAcctMonitor}
              Manual verification:
                Response status: ${httpResp.status} // Expect a HTTP 200
                Response data: ${JSON.stringify(httpResp.body) || httpResp.parsedFenceError}
                // Expect the ID / email address of the fence-service account
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

const svcAcctUpdateTestsMap = {
  regularPatch: {
    expectedStatus: 204,
    expectedResponse: '"undefined" (HTTP 204 = No content)',
  },
  patchUnregisteredAcc: {
    expectedStatus: 404,
    expectedResponse: 'a "Could not find a registered service account from given email" message',
  },
  dryRun: {
    expectedStatus: 200,
    expectedResponse: '"success": true',
  },
};

// Scenario #8/#9/#10 - Updating existing service account, unregistered account & dry run
for (const [typeOfTest, testInstructions] of Object.entries(svcAcctUpdateTestsMap)) {
  oidcUtils.performSvcAcctUpdateTest(typeOfTest, testInstructions);
}

// Scenario #11 - Get billing projects
Scenario('Get billing GCP projects @manual', ifInteractive(
  async ({ I, fence }) => {
    I.cache.ACCESS_TOKEN = !I.cache ? await requestUserInput('Please provide your ACCESS_TOKEN: ') : I.cache.ACCESS_TOKEN;

    const httpResp = await fence.do.getGoogleBillingProjects(I.cache.userAcct);

    const result = await interactive(`
              1. [Automated] Send a HTTP GET request with the NIH user's ACCESS TOKEN to retrieve the list of billing projects associated with the Google Account that was linked:
              HTTP GET request to: https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.getGoogleBillingProjects}
              Manual verification:
                Response status: ${httpResp.status} // Expect a HTTP 200
                Response data: ${JSON.stringify(httpResp.body) || httpResp.parsedFenceError}
                // Expect json payload containing "project_id": null
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #12 - Delete Google service account that has been registered in previous steps
Scenario('Delete existing service account @manual', ifInteractive(
  async ({ I, fence }) => {
    await oidcUtils.collectUserInput(I);
    // patch existing svc acct to remove project access
    const httpResp = await fence.do.deleteGoogleServiceAccount(
      I.cache.userAcct,
      I.cache.googleProject.serviceAccountEmail,
    );
    const result = await interactive(`
              1. [Automated] Send a HTTP DELETE request with the NIH user's ACCESS TOKEN to delete the svc acct: ${I.cache.googleProject.serviceAccountEmail}.
              HTTP DELETE request to: https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.deleteGoogleServiceAccount}/${I.cache.googleProject.serviceAccountEmail}
              Manual verification:
                Response status: ${httpResp.status} // Expect a HTTP 200
                Response data: ${JSON.stringify(httpResp.body) || httpResp.parsedFenceError}
                // Expect a "Successfully delete service account" message
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));
