/*
 RAS Integration Test - AuthZ Only (PXP-6505)
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
Feature('RASAuthZ');

const { sleepMS } = require('../../utils/apiUtil.js');
const { Bash, takeLastLine } = require('../../utils/bash.js');

const bash = new Bash();

BeforeSuite(async (I) => {
  console.log('Setting up dependencies...');
  I.cache = {};

  if (process.env.RAS_TEST_USER_1_USERNAME == undefined) {
    throw new Error('ERROR: There is no username defined for RAS Test User 1. Please declare the "RAS_TEST_USER_1_USERNAME" environment variable and try again. Aborting test...');
  } else if (process.env.RAS_TEST_USER_1_PASSWORD == undefined) {
    throw new Error('ERROR: There is no password defined for RAS Test User 1. Please declare the "RAS_TEST_USER_1_PASSWORD" environment variable and try again. Aborting test...');
  }
});

Scenario('Register a fence client for RAS Test User 1 with the ga4gh_passport_v1 scope @ras @authz', async (I) => {
  const registerClientCmd = `fence-create --arborist http://arborist-service/ client-create --client ras-user1-test-client --user ${process.env.RAS_TEST_USER_1_USERNAME} --urls https://${process.env.HOSTNAME}/user --policies programs.QA-admin programs.test-admin programs.DEV-admin programs.jnkns-admin --allowed-scopes openid user data google_credentials ga4gh_passport_v1`;
  const registerClientForRASUser1 = bash.runCommand(registerClientCmd, 'fence', takeLastLine);
  console.log(`registerClientForRASUser1: ${registerClientForRASUser1}`);
});

Scenario('Perform Gen3 login as RAS Test User 1 @ras @authz', async (I) => {
  I.refreshPage();
  I.amOnPage('/login');
  I.click({ xpath: 'xpath: //button[contains(text(), \'Login from RAS\')]' });

  // await sleepMS(5000);
  // I.saveScreenshot("RAS_Testing_NIH_login_page.png");    
  I.fillField('USER', process.env.RAS_TEST_USER_1_USERNAME);
  I.fillField('PASSWORD', '*yEEwCe`4o');
  await I.click({ xpath: 'xpath: //button[contains(text(), \'Sign in\')]' });
  // await sleepMS(5000);
  // I.saveScreenshot("Back_to_qa_dcf.png");
  I.waitForElement({ css: '.introduction' }, 5);
});

Scenario('Visit Auth URL as RAS Test User 1 and click on I Accept button @ras @authz', async (I) => {
    I.amOnPage(`/user/oauth2/authorize?response_type=code&client_id=${I.cache.rasUser1ClientId}&redirect_uri=https:///${process.env.HOSTNAME}/user&scope=openid+user+data+google_credentials+ga4gh_passport_v1&idp=ras`);
    await I.click({ xpath: 'xpath: //button[contains(text(), \'Yes, I authorize.\')]' });

    const urlWithCode = await I.grabCurrentUrl();
    console.log(`the code: ${urlWithCode}`);
});
