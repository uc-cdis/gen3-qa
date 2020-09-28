/* eslint-disable codeceptjs/no-skipped-tests */
/*
 RAS Integration Test - AuthN Only (PXP-6505)
 This test plan has a few pre-requisites:
 1. Fence > 4.22.3 must be deployed.
 2. There must be an upstream client previously registered with NIH/RAS and
    the test environment must have its client & secret ID stored into its Fence config.
    e.g., $ cat gen3_secrets_folder/configs/fence-config.yaml | yq .OPENID_CONNECT.ras
          {
              "client_id": "****",
              "client_secret": "****",
              "redirect_url": "{{BASE_URL}}/login/ras/callback"
          }
 3. Environment variables containing the NIH USERNAME & PASSWORD of test users must be
    declared either locally or through Jenkins credentials and Groovy (WithCredentials())
    to complete the OIDC flow.
    - RAS_TEST_USER_1_USERNAME
    - RAS_TEST_USER_1_PASSWORD
*/
Feature('RASAuthN - Negative Tests');

const { expect } = require('chai');
const { sleepMS } = require('../../utils/apiUtil.js');
const { Bash, takeLastLine } = require('../../utils/bash.js');

const bash = new Bash();
const I = actor();

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
  console.log(`deleteClientForRASUser1: ${deleteClientForRASUser1}`);
});

const registerRasClient = (username) => {
  const registerClientCmd = 'fence-create'
    + ' --arborist http://arborist-service/ client-create'
    + ' --client ras-user1-test-client'
    + ` --user ${username}`
    + ` --urls https://${process.env.HOSTNAME}/user`
    + ' --policies programs.QA-admin programs.test-admin programs.DEV-admin programs.jnkns-admin'
    + ' --allowed-scopes openid user data google_credentials ga4gh_passport_v1';

  const registerClientForRASUser1 = bash.runCommand(registerClientCmd, 'fence', takeLastLine);
  console.log(`registerClientForRASUser1: ${registerClientForRASUser1}`);

  const re = /\('(.*)',\s'(.*)'\)/;
  const clientID = registerClientForRASUser1.match(re)[1];
  const secretID = registerClientForRASUser1.match(re)[2];

  return {
    clientID,
    secretID,
  };
};

const rasAuthLogin = async (url, username, password) => {
  I.amOnPage(url);
  await sleepMS(3000);
  I.saveScreenshot('NIH_Login_1.png');

  I.fillField('USER', username);
  I.fillField('PASSWORD', password);
  I.click({ xpath: 'xpath: //button[contains(text(), \'Sign in\')]' });
  await sleepMS(3000);
  I.saveScreenshot('NIH_Login_2.png');
};

Scenario('Provide invalid credentials in NIH Login page @rasAuthN @negativeTest', async () => {
  // Using RAS Test User 1
  const rasClient = registerRasClient(process.env.RAS_TEST_USER_1_USERNAME);

  const authUrl = `/user/oauth2/authorize
  ?response_type=code&client_id=${rasClient.clientID}
  &redirect_uri=https://${process.env.HOSTNAME}/user
  &scope=openid+user+data+google_credentials+ga4gh_passport_v1&idp=ras`;

  await rasAuthLogin(authUrl, process.env.RAS_TEST_USER_1_USERNAME, 'THIS_IS_AN_INVALID_PASSWORD_FOR_USER_1');

  I.seeTextEquals('Login Failed', 'h1');
});

Scenario('Click on Deny button in RAS Authorization page @rashAuthN @negativeTest', async () => {
  // Using RAS Test User 1
  const rasClient = registerRasClient(process.env.RAS_TEST_USER_1_USERNAME);
  console.log(rasClient);

  const authUrl = `/user/oauth2/authorize
  ?response_type=code&client_id=${rasClient.clientID}
  &redirect_uri=https://${process.env.HOSTNAME}/user
  &scope=openid+user+data+google_credentials+ga4gh_passport_v1&idp=ras`;

  await rasAuthLogin(authUrl, process.env.RAS_TEST_USER_1_USERNAME,
    process.env.RAS_TEST_USER_1_PASSWORD);

  const postNIHLoginURL = await I.grabCurrentUrl();
  if (postNIHLoginURL === 'https://stsstg.nih.gov/auth/oauth/v2/authorize/consent') {
    I.click({ xpath: 'xpath: //input[@value=\'Deny\']' });
  }

  await sleepMS(3000);
  const urlWithCode = await I.grabCurrentUrl();
  expect(urlWithCode).to.contain('error_description=The+resource_owner+denied+access+to+resources',
    'The error message is not as expected');
});
