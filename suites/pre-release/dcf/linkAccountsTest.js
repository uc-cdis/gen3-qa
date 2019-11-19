//  This test plan has a few pre-requisites: Check prereq.md for more details.
Feature('Linking accounts - DCF Staging testing for release sign off - https://ctds-planx.atlassian.net/browse/PXP-3836');

// To be executed with GEN3_SKIP_PROJ_SETUP=true -- No need to set up program / retrieve access token, etc.

const readline = require('readline');
const ax = require('axios');
const fs = require('fs');
const user = require('../../utils/user.js');
const chai = require('chai');
const {interactive, ifInteractive} = require('../../utils/interactive.js');
const { Gen3Response } = require('../../utils/apiUtil');
const expect = chai.expect;

// Test elaborated for nci-crdc but it can be reused in other projects
const commons_hostname = process.env.GEN3_COMMONS_HOSTNAME || 'nci-crdc-staging.datacommons.io';
const TARGET_ENVIRONMENT = `https://${commons_hostname}`

function getCurrTimePlus(hours) {
    return new Date().getHours() + hours;
}

function httpReq(url, data, access_token) {
  return new Promise(function(resolve, reject) {
    ax.request({
      url: '/user/credentials/cdis/access_token',
      baseURL: `https://${TARGET_ENVIRONMENT}`,
      method: 'post',
      maxRedirects: 0,
      header: {
        "content-type": "application/json",
        "accept": "application/json"
      },
      data: {
        api_key: the_api_key
      }
    })
    .then(resp => {
      // console.log('resp.data: ' + JSON.stringify(resp.data));
      resolve(resp.data);
    }).catch(err => {
      // console.log(err.response);
      // console.log(err);
      return reject(err.response || err);
    });
  });
}

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
// Note: Cannot leverage the ${user.mainAcct.accessToken} while working on an internal staging env. (i.e., no access to the underlying admin vm, hence, using API Key + Fence HTTP API to retrieve the Access Token)
Scenario(`Use API Key to obtain Access Token and link Google identity to NIH user, set expiration parameter and unlink it @manual`, ifInteractive(
    async(I, fence) => {
	// Prompt user for API_KEY to automatically obtain the ACCESS TOKEN
	let API_KEY = await requestUserInput(`
              1. Navigate to the "Profile" page on ${TARGET_ENVIRONMENT} and click on "Create API key".
              2. Download the "credentials.json" file, copy the value of the "api_key" parameter and paste it here:
        `);
	let ACCESS_TOKEN = await httpReq(
	    '/user/credentials/cdis/access_token',{
		api_key: API_KEY
	    }, undefined);
	console.log('access token: ' + ACCESS_TOKEN);

	const result = await interactive (`
              1. Copy and paste the following URL into your browser:
                 ${TARGET_ENVIRONMENT}/user/link/google?redirect=/login
              2. Provide the credentials of the Google account that owns the "Customer" GCP account
                 This Google account will be linked to the NIH account within this Gen3 environment.
              3. [Automated] Send a HTTP PATCH request with the NIH user's ACCESS TOKEN to extend the expiration date of this Google account access (?expires_in=<current epoch time + 2 hours>):
                 curl -v -X PATCH -H "Authorization: Bearer \$\{ACCESS_TOKEN\}" https://nci-crdc-staging.datacommons.io/user/link/google\?expires_in\=${getCurrTimePlus(2)}

              Expect a < HTTP/1.1 200 OK response containing the new "exp" date.
            `);
	expect(result.didPass, result.details).to.be.true;
    }
));



