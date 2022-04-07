/* eslint-disable max-len */
Feature('DRS RAS');

const { expect } = require('chai');
// const { URL } = require('url');
// const { Bash } = require('../../utils/bash');
const { sleepMS } = require('../../utils/apiUtil.js');
const queryString  = require('query-string');

// const bash = new Bash();

const TARGET_ENVIRONMENT = `${process.env.NAMESPACE}.planx-pla.net`;

// RAS endpoints
const ga4ghURL = `${TARGET_ENVIRONMENT}/ga4gh/drs/v1/objects/`;
// Ras Server URL
const rasServerURL = 'stsstg.nih.gov';
const scope = 'openid profile email ga4gh_passport_v1'
// hardcoded for testing purposes
// TODO - make the test more generic bases on the access
// upload a dummy indexd record with correct authz resource path
const authZ = '/programs/phs000298.c1';

const indexdFile = {
    fileToUpload: {
        "acl": [],
        "authz": [ '/programs/phs000298.c1' ],
        "filename": 'ras_test_file',
        "hashes": { md5: '587efb5d96f695710a8df9c0dbb96eb0' }, // pragma: allowlist secret
        "size": 15,
        "form": null,
        "urls": [ 's3://cdis-presigned-url-test/testdata', 'gs://cdis-presigned-url-test/testdata'],
    },
};

BeforeSuite(async ({ I }) => {
  console.log('Setting up .. ');
  I.cache = {};
  console.log("In BeforeSuite ....");

  // check if the RAS user and password is defined as the env variable or in Jenkins creds
  if (process.env.RAS_TEST_USER_1_USERNAME === undefined) {
    throw new Error('ERROR: There is no username defined for RAS Test User 1. Please declare the "RAS_TEST_USER_1_USERNAME" environment variable and try again. Aborting test...');
  } else if (process.env.RAS_TEST_USER_1_PASSWORD === undefined) {
    throw new Error('ERROR: There is no password defined for RAS Test User 1. Please declare the "RAS_TEST_USER_1_PASSWORD" environment variable and try again. Aborting test...');
  }

  // TODO : post new indexdFile before 

  // if the authz resource path is hardcoded, you run this to fetch the did of file with hardcoded authz path
  // get indexd record for presignedurl request
  const getIndexRecord = await I.sendGetRequest(
    `https://${TARGET_ENVIRONMENT}/index/index?authz=${authZ}`,
  );
  //   console.log(`Indexd Record : ${JSON.stringify(getIndexRecord.data.records[0].did)}`);
  I.cache.indexdRecord = getIndexRecord.data.records[0].did;
  console.log(`Indexd Record DID: ${I.cache.indexdRecord}`);
});

// step 1 getting the clientID and clientSecret from the fence config of the env
Scenario('Get the clientID and clientSecret', async ({ I }) => {
  // const clientID = bash.runCommand('gen3 secrets decode fence-config fence-config.yaml | yq .OPENID_CONNECT.ras.client_id');
  I.cache.clientID = process.env.clientID;
  // const secretID = bash.runCommand('gen3 secrets decode fence-config fence-config.yaml | yq .OPENID_CONNECT.ras.client_secret');
  I.cache.clientSecret = process.env.secretID;
});

Scenario('Visit the URL and consent', async ({ I }) => {
  // here we are using the a different env registered with RAS for redirect_uri
  // b/c the running env is consumes the authCode generated in the following request
  // so we need a non-running env which is registered with RAS as redirect_uri
  // should also be applicable for integration tests that
  I.amOnPage(`https://${rasServerURL}/auth/oauth/v2/authorize?response_type=code&client_id=${I.cache.clientID}&redirect_uri=https://qa-dcp.planx-pla.net/user/login/ras/callback&scope=${scope}&idp=ras`);
  // GET auth/oauth/v2/authorize to get the rasAuthCode
  await sleepMS(3000);
  I.saveScreenshot('NIHLogin_Page.png');
  // fill in the RAS user creds
  I.fillField('USER', process.env.RAS_TEST_USER_1_USERNAME);
  I.fillField('PASSWORD', process.env.RAS_TEST_USER_1_PASSWORD);
  I.click({ xpath: 'xpath: //button[contains(text(), \'Sign in\')]' });
  await sleepMS(3000);
  // after signin, the url will consist of Auth Code
  const authCodeURL = await I.grabCurrentUrl();
  console.log(authCodeURL);
  const url = new URL(authCodeURL);
  const authCode = url.searchParams.get('code');
  // check if the authCode isnt empty
  expect(authCode).to.not.to.be.empty;
  I.cache.rasAuthCode = authCode;
  console.log(`Auth Code = ${I.cache.rasAuthCode}`);
});

Scenario('Obtain passport for RAS User', async ({ I }) => {
  // POST /auth/oauth/v2/token to get RAS token
  const rasAuthURL = `https://${rasServerURL}/auth/oauth/v2/token`;
  const data = queryString.stringify({
    "grant_type": "authorization_code",
    "code": `${I.cache.rasAuthCode}`,
    "client_id": `${I.cache.clientID}`,
    "client_secret": `${I.cache.clientSecret}`,
    "scope": `${scope}`,
    "redirect_uri": "https://qa-dcp.planx-pla.net/user/login/ras/callback"
  });
     
  const getRASToken = await I.sendPostRequest(
    rasAuthURL,
    data,
    {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  );
  // you should get RAS tokens (id, access, refresh)
  console.log(`${JSON.stringify(getRASToken.data.access_token)}`);
  I.cache.rasToken = getRASToken.data.access_token;
  I.cache.refreshToken = getRASToken.data.refresh_token;

  // GET /openid/connect/v1.1/userinfo passport for the RAS user with RAS Access token
  const getPassportReq = await I.sendGetRequest(
    `https://${rasServerURL}/openid/connect/v1.1/userinfo`,
    {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${I.cache.rasToken}`,
    },
  );
  // you should get a passport with visa as the response
  I.cache.passportBody = getPassportReq.data.passport_jwt_v11;
});

Scenario('Send DRS request - Single Passport Single VISA', async ({ I }) => {
  // sending DRS request with passport in body
  const drsAccessReq = await I.sendPostRequest(
    `https://${ga4ghURL}/${I.cache.indexdRecord}/access/s3`,
    {
      "passports": [`${I.cache.passportBody}`]
    },
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

Scenario('Get Access Token from Refresh Token', async({ I }) => {
  // get new access token from the refresh token
  // and make /userinfo call with the new access tokens
  const rasAuthURL = `https://${rasServerURL}/auth/oauth/v2/token`;
  const refreshData = queryString.stringify({
    "grant_type": "refresh_token",
    "refresh_token": `${I.cache.refresh_token}`,
    "scope": `${scope}`,
    "client_id": `${I.cache.clientID}`,
    "client_secret": `${I.cache.clientSecret}`,
  });

  const tokenFromRefresh =  await I.sendPostRequest(
    rasAuthURL,
    refreshData,
    {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  );
  console.log(`${JSON.stringify(tokenFromRefresh.data.access_token)}`);
  // and send subsequent /userinfo call and also a presigned url call with the passport

});

// Scenario('Consent Management', async ({ I }) => {
    // TODO
// });