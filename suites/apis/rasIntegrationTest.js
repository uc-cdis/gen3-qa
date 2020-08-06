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
    - RAS_TEST_USER_2_USERNAME
    - RAS_TEST_USER_2_PASSWORD
*/
Feature('RASAuthN');

const { expect } = require('chai');
const { sleepMS, parseJwt } = require('../../utils/apiUtil.js');
const { Bash, takeLastLine } = require('../../utils/bash.js');

const bash = new Bash();

BeforeSuite(async (I) => {
  console.log('Setting up dependencies...');
  I.cache = {};

  if (process.env.RAS_TEST_USER_1_USERNAME === undefined) {
    throw new Error('ERROR: There is no username defined for RAS Test User 1. Please declare the "RAS_TEST_USER_1_USERNAME" environment variable and try again. Aborting test...');
  } else if (process.env.RAS_TEST_USER_1_PASSWORD === undefined) {
    throw new Error('ERROR: There is no password defined for RAS Test User 1. Please declare the "RAS_TEST_USER_1_PASSWORD" environment variable and try again. Aborting test...');
  }
  if (process.env.RAS_TEST_USER_2_USERNAME === undefined) {
    throw new Error('ERROR: There is no username defined for RAS Test User 2. Please declare the "RAS_TEST_USER_2_USERNAME" environment variable and try again. Aborting test...');
  } else if (process.env.RAS_TEST_USER_2_PASSWORD === undefined) {
    throw new Error('ERROR: There is no password defined for RAS Test User 2. Please declare the "RAS_TEST_USER_2_PASSWORD" environment variable and try again. Aborting test...');
  }

  // Deleting registered clients for idempotent local runs
  const deleteClientCmd1 = 'fence-create --arborist http://arborist-service/ client-delete --client ras-user1-test-client';
  const deleteClientForRASUser1 = bash.runCommand(deleteClientCmd1, 'fence', takeLastLine);
  console.log(`deleteClientForRASUser1: ${deleteClientForRASUser1}`);

  const deleteClientCmd2 = 'fence-create --arborist http://arborist-service/ client-delete --client ras-user2-test-client';
  const deleteClientForRASUser2 = bash.runCommand(deleteClientCmd2, 'fence', takeLastLine);
  console.log(`deleteClientForRASUser2: ${deleteClientForRASUser2}`);
});

Scenario('Register a fence client for RAS Test User 1 with the ga4gh_passport_v1 scope @rasAuthN', async (I) => {
  const registerClientCmd = `fence-create --arborist http://arborist-service/ client-create --client ras-user1-test-client --user ${process.env.RAS_TEST_USER_1_USERNAME} --urls https://${process.env.HOSTNAME}/user --policies programs.QA-admin programs.test-admin programs.DEV-admin programs.jnkns-admin --allowed-scopes openid user data google_credentials ga4gh_passport_v1`;

  const registerClientForRASUser1 = bash.runCommand(registerClientCmd, 'fence', takeLastLine);
  console.log(`registerClientForRASUser1: ${registerClientForRASUser1}`);

  const re = /\('(.*)',\s'(.*)'\)/;
  const clientID = registerClientForRASUser1.match(re)[1];
  const secretID = registerClientForRASUser1.match(re)[2];
  expect(clientID).to.not.to.be.empty;
  expect(secretID).to.not.to.be.empty;

  I.cache.rasUser1ClientId = clientID;
  I.cache.rasUser1SecretId = secretID;
});

Scenario('Visit Auth URL as RAS Test User 1 and click on I Accept button @rasAuthN', async (I) => {
  I.amOnPage(`/user/oauth2/authorize?response_type=code&client_id=${I.cache.rasUser1ClientId}&redirect_uri=https://${process.env.HOSTNAME}/user&scope=openid+user+data+google_credentials+ga4gh_passport_v1&idp=ras`);
  await sleepMS(5000);
  I.saveScreenshot('NIH_Login_Page_user2.png');

  I.fillField('USER', process.env.RAS_TEST_USER_1_USERNAME);
  I.fillField('PASSWORD', process.env.RAS_TEST_USER_1_PASSWORD);
  await I.click({ xpath: 'xpath: //button[contains(text(), \'Sign in\')]' });

  await sleepMS(5000);
  I.saveScreenshot('I_authorize_page_user1.png');
  I.waitForElement({ css: '.auth-list' }, 10);

  await I.click({ xpath: 'xpath: //button[contains(text(), \'Yes, I authorize.\')]' });

  await sleepMS(5000);
  const urlWithCode = await I.grabCurrentUrl();
  console.log(`the code: ${urlWithCode}`);

  const theCode = urlWithCode.split('=')[1];
  expect(theCode).to.not.to.be.empty;
  I.cache.rasUser1AuthCode = theCode;

  // Check ras test user 1 info
  I.amOnPage('/user/user');
  I.grabTextFrom('body').then((userInfo) => {
    const ga4ghPassportToken = JSON.parse(userInfo).ga4gh_passport_v1;
    console.log(`ga4gh_passport_v1 jwt from /user/user output: ${ga4ghPassportToken}`);

    // decode JWT / ga4gh_passport_v1
    const ga4ghPassportTokenJson = parseJwt(ga4ghPassportToken);
    console.log(`ga4gh_visa_v1 decoded info: ${ga4ghPassportTokenJson.ga4gh_visa_v1}`);
    expect(ga4ghPassportTokenJson.ga4gh_visa_v1).to.have.property('type', 'https://ras.nih.gov/visas/v1');
  });
});

Scenario('Use client creds from RAS Test User 1 and auth code to obtain access token and check if scope includes ga4gh_passport_v1 @rasAuthN', async (I) => {
  const obtainTokensCmd = `curl --user "${I.cache.rasUser1ClientId}:${I.cache.rasUser1SecretId}" -X POST "https://${process.env.HOSTNAME}/user/oauth2/token?grant_type=authorization_code&code=${I.cache.rasUser1AuthCode}&redirect_uri=https://${process.env.HOSTNAME}/user"`;
  const obtainTokensForRASUser1 = bash.runCommand(obtainTokensCmd);
  console.log(`obtainTokensForRASUser1: ${JSON.stringify(obtainTokensForRASUser1)}`);

  const tokens = JSON.parse(obtainTokensForRASUser1);

  // decode JWT / Access Token
  const accessTokenJson = parseJwt(tokens.access_token);

  console.log(`access token scopes: ${accessTokenJson.aud}`);
  expect(accessTokenJson.aud).to.include('ga4gh_passport_v1');
});

Scenario('Register a fence client for RAS Test User 2 without the ga4gh_passport_v1 scope @rasAuthN', async (I) => {
  const registerClientCmd = `fence-create --arborist http://arborist-service/ client-create --client ras-user2-test-client --user ${process.env.RAS_TEST_USER_2_USERNAME} --urls https://${process.env.HOSTNAME}/user --policies programs.QA-admin programs.test-admin programs.DEV-admin programs.jnkns-admin --allowed-scopes openid user data google_credentials`;

  const registerClientForRASUser2 = bash.runCommand(registerClientCmd, 'fence', takeLastLine);
  console.log(`registerClientForRASUser2: ${registerClientForRASUser2}`);

  const re = /\('(.*)',\s'(.*)'\)/;
  const clientID = registerClientForRASUser2.match(re)[1];
  const secretID = registerClientForRASUser2.match(re)[2];
  expect(clientID).to.not.to.be.empty;
  expect(secretID).to.not.to.be.empty;

  I.cache.rasUser2ClientId = clientID;
  I.cache.rasUser2SecretId = secretID;
});

Scenario('Visit Auth URL as RAS Test User 2 and click on I Accept button @rasAuthN', async (I) => {
  I.amOnPage(`/user/oauth2/authorize?response_type=code&client_id=${I.cache.rasUser2ClientId}&redirect_uri=https://${process.env.HOSTNAME}/user&scope=openid+user+data+google_credentials&idp=ras`);
  await sleepMS(5000);
  I.saveScreenshot('NIH_Login_Page_user2.png');

  I.fillField('USER', process.env.RAS_TEST_USER_2_USERNAME);
  I.fillField('PASSWORD', process.env.RAS_TEST_USER_2_PASSWORD);
  await I.click({ xpath: 'xpath: //button[contains(text(), \'Sign in\')]' });

  await sleepMS(5000);
  I.saveScreenshot('I_authorize_page_user2.png');
  I.waitForElement({ css: '.auth-list' }, 10);

  await I.click({ xpath: 'xpath: //button[contains(text(), \'Yes, I authorize.\')]' });

  await sleepMS(5000);
  const urlWithCode = await I.grabCurrentUrl();
  console.log(`the code: ${urlWithCode}`);

  const theCode = urlWithCode.split('=')[1];
  expect(theCode).to.not.to.be.empty;
  I.cache.rasUser2AuthCode = theCode;

  // Check ras test user 2 info
  I.amOnPage('/user/user');
  I.grabTextFrom('body').then((userInfo) => {
    const ga4ghPassportToken = JSON.parse(userInfo).ga4gh_passport_v1;
    console.log(`ga4gh_passport_v1 jwt from /user/user output: ${ga4ghPassportToken}`);

    // decode JWT / ga4gh_passport_v1
    const ga4ghPassportTokenJson = parseJwt(ga4ghPassportToken);
    console.log(`ga4gh_visa_v1 decoded info: ${ga4ghPassportTokenJson.ga4gh_visa_v1}`);

    // TODO: Clarify this issue here
    // expect(ga4ghPassportTokenJson.ga4gh_visa_v1).to.not.have.property('type', 'https://ras.nih.gov/visas/v1');
  });
});

Scenario('Use client creds for RAS Test User 2 and auth code to obtain access token and check if scope does not include ga4gh_passport_v1 @rasAuthN', async (I) => {
  const obtainTokensCmd = `curl --user "${I.cache.rasUser2ClientId}:${I.cache.rasUser2SecretId}" -X POST "https://${process.env.HOSTNAME}/user/oauth2/token?grant_type=authorization_code&code=${I.cache.rasUser2AuthCode}&redirect_uri=https://${process.env.HOSTNAME}/user"`;
  const obtainTokensForRASUser2 = bash.runCommand(obtainTokensCmd);
  console.log(`obtainTokensForRASUser2: ${JSON.stringify(obtainTokensForRASUser2)}`);

  const tokens = JSON.parse(obtainTokensForRASUser2);

  // decode JWT / Access Token
  const accessTokenJson = parseJwt(tokens.access_token);

  console.log(`access token scopes: ${accessTokenJson.aud}`);
  expect(accessTokenJson.aud).to.not.include('ga4gh_passport_v1');
});
