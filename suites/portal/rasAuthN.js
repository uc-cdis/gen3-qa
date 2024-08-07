/* eslint-disable codeceptjs/no-skipped-tests */
/*
 RAS Integration Test - AuthN Only (PXP-6505)
 This test plan has a few pre-requisites:
 1. Fence > 4.23.0 must be deployed.
 2. There must be an upstream client previously registered with NIH/RAS and
    the test environment must have its client & secret ID stored into its Fence config.
    e.g., $ cat gen3_secrets_folder/configs/fence-config.yaml | yq .OPENID_CONNECT.ras
          {
              "client_id": "****",
              "client_secret": "****",
              "redirect_url": "{{BASE_URL}}/login/ras/callback"
              "discovery_url": "<DISCOVERY_URL"
          }
 3. Environment variables containing the NIH USERNAME & PASSWORD of test users must be
    declared either locally or through Jenkins credentials and Groovy (WithCredentials())
    to complete the OIDC flow.
    - RAS_TEST_USER_1_USERNAME
    - RAS_TEST_USER_1_PASSWORD
*/
Feature('RASAuthN - Negative Tests @requires-portal @requires-fence');

const { expect } = require('chai');
const { sleepMS } = require('../../utils/apiUtil.js');
const { Bash, takeLastLine } = require('../../utils/bash.js');
const { registerRasClient } = require('../../utils/rasAuthN');

const bash = new Bash();
const I = actor();

const rasAuthLogin = async (username, password) => {
  // check these if you run into errors:
  // - process.env.RAS_TEST_USER_1_USERNAME
  // - process.env.RAS_TEST_USER_1_PASSWORD
  expect(username, '"rasAuthLogin" needs "username" to proceed').to.not.be.empty;
  expect(password, '"rasAuthLogin" needs "password" to proceed').to.not.be.empty;

  const { clientID } = registerRasClient(username);
  const authUrl = '/user/oauth2/authorize?'
    + 'response_type=code'
    + `&client_id=${clientID}`
    + `&redirect_uri=https://${process.env.HOSTNAME}/user`
    + '&scope=openid+user+data+google_credentials+ga4gh_passport_v1'
    + '&idp=ras';
  await sleepMS(3000);
  I.amOnPage(authUrl);
  I.saveScreenshot('NIH_Login_1.png');

  I.fillField('USER', username);
  I.fillField('PASSWORD', password);
  I.click({ xpath: 'xpath: //button[contains(text(), \'Sign in\')]' });
  await sleepMS(3000);
  I.saveScreenshot('NIH_Login_2.png');
};

Before(async () => {
  console.log('Setting up dependencies...');
  I.cache = {};

  if (process.env.RAS_TEST_USER_1_USERNAME === undefined) {
    throw new Error('ERROR: There is no username defined for RAS Test User 1. Please declare the "RAS_TEST_USER_1_USERNAME" environment variable and try again. Aborting test...');
  } else if (process.env.RAS_TEST_USER_1_PASSWORD === undefined) {
    throw new Error('ERROR: There is no password defined for RAS Test User 1. Please declare the "RAS_TEST_USER_1_PASSWORD" environment variable and try again. Aborting test...');
  }

  // Deleting registered clients for idempotent local runs
  const deleteClientCmd1 = 'fence-create --arborist http://arborist-service/ client-delete --client ras-user1-test-client';
  const deleteClientForRASUser1 = bash.runCommand(deleteClientCmd1, 'fence', takeLastLine);
  if (process.env.DEBUG === 'true') {
    console.log(`deleteClientForRASUser1: ${deleteClientForRASUser1}`);
  }
});

Scenario('Provide invalid credentials in NIH Login page @rasAuthN', async () => {
  // Using RAS Test User 1
  await rasAuthLogin(process.env.RAS_TEST_USER_1_USERNAME, 'THIS_IS_AN_INVALID_PASSWORD_FOR_USER_1');
  I.seeTextEquals('Login Failed', 'h1');
});

Scenario('Click on Deny button in RAS Authorization page @rashAuthN @manual', async () => {
  // Using RAS Test User 1
  await rasAuthLogin(process.env.RAS_TEST_USER_1_USERNAME, process.env.RAS_TEST_USER_1_PASSWORD);

  const postNIHLoginURL = await I.grabCurrentUrl();
  if (postNIHLoginURL === 'https://stsstg.nih.gov/auth/oauth/v2/authorize/consent') {
    I.click({ xpath: 'xpath: //input[@value=\'Deny\']' });
  }
  I.saveScreenshot('NIH_Login_3.png');
  await sleepMS(3000);
  const urlWithCode = await I.grabCurrentUrl();
  if (process.env.DEBUG === 'true') {
    console.log(`URL With Code - ${urlWithCode}`);
  }
  expect(urlWithCode).to.contain('error_description=The+resource_owner+denied+access+to+resources',
    'The error message is not as expected');
});
