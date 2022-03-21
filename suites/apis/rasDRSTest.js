Feature('DRS RAS');

const { expect } = require('chai');
const { Bash } = require('../../utils/bash');
const { sleepMS } = require('../../utils/apiUtil.js');

const bash = new Bash();

const TARGET_ENVIRONMENT = `${process.env.NAMESPACE}.planx-pla.net`;

// RAS endpoints
const ga4ghURL = `${TARGET_ENVIRONMENT}/ga4gh/drs/v1/objects/`;
// Ras Server URL
const rasServerURL = 'stsstg.nih.gov';
// hardcoded for testing purposes
// TODO - make the test more generic bases on the access
const authZ = '/programs/phs000710.c99';

BeforeSuite(async ({ I }) => {
  I.cache = {};

  // check if the RAS user and password is defined as the env variable or in Jenkins creds
  if (process.env.RAS_TEST_USER_1_USERNAME === undefined) {
    throw new Error('ERROR: There is no username defined for RAS Test User 1. Please declare the "RAS_TEST_USER_1_USERNAME" environment variable and try again. Aborting test...');
  } else if (process.env.RAS_TEST_USER_1_PASSWORD === undefined) {
    throw new Error('ERROR: There is no password defined for RAS Test User 1. Please declare the "RAS_TEST_USER_1_PASSWORD" environment variable and try again. Aborting test...');
  }
  // get indexd record for presignedurl request
  const getIndexRecord = await I.sendGetRequest(
    `https://${TARGET_ENVIRONMENT}/index/index?authz=${authZ}`,
  );
  I.cache.indexdRecord = getIndexRecord.body.records.did;
});

// step 1 getting the clientID and clientSecret from the fence config of the env
Scenario('Get the clientID and clientSecret', async ({ I }) => {
  const clientID = bash.runCommand('gen3 secrets decode fence-config fence-config.yaml | yq .OPENID_CONNECT.ras.client_id');
  I.cache.clientID = clientID;
  const secretID = bash.runCommand('gen3 secrets decode fence-config fence-config.yaml | yq .OPENID_CONNECT.ras.client_secret');
  I.cache.clientSecret = secretID;
});

Scenario('Visit the URL and consent', async ({ I }) => {
  I.amOnPage(`https://${rasServerURL}/oauth2/authorize?response_type=code&client_id=${I.cache.clientID}&redirect_uri=https://${TARGET_ENVIRONMENT}/user/login/ras/callback&scope=openid+user+data+google_credentials+ga4gh_passport_v1&idp=ras`);
  // GET auth/oauth/v2/authorize to get the rasAuthCode
  await sleepMS(3000);
  I.saveScreenshot('NIHLogin_Page.png');
  // fill in the RAS user creds
  I.fillField('USER', process.env.RAS_TEST_USER_1_USERNAME);
  I.fillField('PASSWORD', process.env.RAS_TEST_USER_1_PASSWORD);
  I.click({ xpath: 'xpath: //button[contains(text(), \'Sign in\')]' });
  // after signing in, you will be taken to the consent page and
  // where you will get the rasAuthCode
  await sleepMS(3000);
  const consentURL = I.grabCurrentUrl();
  I.saveScreenshot('consentURL.png');
  if (consentURL === `https://${rasServerURL}/auth/oauth/v2/authorize/consent`) {
    I.click({ xpath: 'xpath: //input[@value=\'Grant\']' });
  }
  I.waitForElement({ css: '.auth-list' }, 10);
  await I.click({ xpath: 'xpath: //button[contains(text(), \'Yes, I authorize.\')]' });
  await sleepMS(3000);
  const authCodeURL = await I.grabCurrentUrl();
  const authCode = authCodeURL.split('=')[1];
  // TODO : check if the authCode isnt empty
  I.cache.rasAuthCode = authCode;
});

Scenario('Obtain passport for RAS User', async ({ I }) => {
  // POST /auth/oauth/v2/token to get RAS token
  const rasAuthURL = `https://${rasServerURL}/auth/oauth/v2/token?`
        + 'grant_type=authorization_code'
        + `&code=${I.cache.rasAuthCode}`
        + '&scope=openid+email+profile+ga4gh_passport_v1'
        + `&client_secret=${I.cache.clientSecret}`
        + `&client_id=${I.cache.clientID}`
        + `redirect_uri=https://${TARGET_ENVIRONMENT}/user/login/ras/callback`;

  const getRASToken = await I.sendPostRequest(
    rasAuthURL,
    {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  );
    // you should get RAS tokens (id, access, refresh)
  console.log(`${getRASToken}`);
  I.cache.rasToken = '';

  // GET /openid/connect/v1.1/userinfo passport for the RAS user with RAS Access token
  const getPassportReq = await I.sendGetRequest(
    `https://${rasServerURL}/openid/connect/v1.1/userinfo`,
    {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${I.cache.rasToken}`,
    },
  );
    // you should get a passport with visa as the response
  console.log(`${getPassportReq}`);
  I.cache.passportBody = '';
});

Scenario('Send DRS request - Single Passport Single VISA', async ({ I }) => {
  // sending DRS request with passport in body
  const drsAccessReq = await I.sendPostRequest(
    `https://${ga4ghURL}/${I.cache.indexdRecord}/access/s3`,
    I.cache.passportBody,
    {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  );
    // verify / check the access
  expect(drsAccessReq).to.have.property('status', 200);

  expect(drsAccessReq.data).to.have.property('url');
  if (String(drsAccessReq.data).includes('You don\'t have access permission on this file')) {
    expect.fail('Access Denied');
  }

  const preSignedURLReq = await I.sendGetRequest(drsAccessReq.data.url);
  expect(preSignedURLReq).to.not.be.empty;
});
