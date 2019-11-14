/*
 This test plan has a few pre-requisites:
 1. Google (<user>@uchicago.edu entry in users.yaml) & NIH access to the environment.
 2. Google Cloud Platform (GCP) account (outside the PlanX Org, i.e., simulating a customer account).
 3. An "outsider" Google account that owns the "customer" GCP account.
 4. A "fence-service" account must be added as "editor" to IAM (with permissions to scan accounts).
 5. A New "customer" service account must be created so it can be linked as part of the test flow.
 6. Existing files (successfully uploaded and indexed). A portion of these files must have a proper ACL configuration for both Google & NIH accounts, some files need to have an ACL versus Project Access mismatch to test "Access Denied" scenarios.
 7. Client ID provided by developers (required for OIDC bootstrapping).
 8. Client Secret provided by developers (Used for basic auth to obtain tokens and to refresh the access token).
*/
Feature('DCF Staging Testing to be executed to sign off on releases - https://ctds-planx.atlassian.net/browse/PXP-3836');

// To be executed with GEN3_SKIP_PROJ_SETUP=true -- No need to set up program / retrieve access token, etc.

const readline = require("readline");
const user = require('../../utils/user.js');
const chai = require('chai');
const {interactive, ifInteractive} = require('../../utils/interactive.js');
const { Gen3Response } = require('../../utils/apiUtil');
const expect = chai.expect;

// Test elaborated for nci-crdc but it can be reused in other projects
const hostname = process.env.HOSTNAME || 'nci-crdc-staging.datacommons.io';
const TARGET_ENVIRONMENT = `https://${hostname}`

function getCurrTimePlus(hours) {
    return new Date().getHours() + hours;
}

meh
BeforeSuite(async(I) => {
    console.log('Setting up dependencies...');
    // random number to be used in one occasion (it must be unique for every iteration)
    // making this data accessible in all scenarios through the actor's memory (the "I" object)
    I.NONCE = Date.now();
});

// Scenario #1 - Verifying NIH access and permissions (project access)
Scenario(`Login to ${TARGET_ENVIRONMENT} and check the Project Access list under the Profile page @manual`, ifInteractive(
    async(I, fence) => {
	const result = await interactive (`
              1. Go to ${TARGET_ENVIRONMENT}
              2. Login with NIH account
              3. Check if the Profile page contains projects the user can access

              e.g., The projects are usually named as "phs000178".
            `);
	expect(result.didPass, result.details).to.be.true;
    }
));

// Scenario #2 - Link Google Service Account from the "customer" GCP account
Scenario(`Link Google identity to NIH user, set expiration parameter and unlink it @manual`, ifInteractive(
    async(I, fence) => {
	const result = await interactive (`
              1. Copy and paste the following URL into your browser:
                 ${TARGET_ENVIRONMENT}/user/link/google?redirect=/login
              2. Provide the credentials of the Google account that owns the "Customer" GCP account
                 This Google account will be linked to the NIH account within this Gen3 environment.

              3. Run the following curl command to send a HTTP PATCH request and extend the expiration date of this Google account access (?expires_in=<current epoch time + 2 hours>):
                 curl -v -X PATCH -H "Authorization: Bearer ${user.mainAcct.accessToken}" https://nci-crdc-staging.datacommons.io/user/link/google\?expires_in\=${getCurrTimePlus(2)}

              Expect a < HTTP/1.1 200 OK response containing the new "exp" date.
            `);
	expect(result.didPass, result.details).to.be.true;
    }
));



