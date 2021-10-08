/*
 Single Passport with single RAS Visas - positive and negative tests (PXP-8795)
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
*/
Feature('DRS access with RAS passport');

const HTTP_MOCKING_ENABLED = true;

const TARGET_ENVIRONMENT = `${process.env.NAMESPACE}.planx-pla.net`;

// temporary until feature is implemented
const nock = require('nock');

const { registerRasClient } = require('../../utils/rasAuthN');
const { parseJwt, sleepMS } = require('../../utils/apiUtil.js');
const { expect } = require('chai');
const { Bash, takeLastLine } = require('../../utils/bash.js');

const bash = new Bash();

const expectedContentsOfTheTestFile = 'test\n'; // eslint-disable-line no-unused-vars

const indexedFiles = {
  drsEmbeddedPassportDataAccessTestFile1: {
    filename: 'test',
    link: 's3://planx-ci-drs-ras-data-access-test/test',
    md5: 'd8e8fca2dc0f896fd7cb4cb0031ba249',
    acl: ['QA'],
    size: 5,
  },
};

// TODO: Introduce a RAS Staging passport here
const requestBody = {
  passports: ['eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1 **** '],
};

BeforeSuite(async ({ I, indexd }) => {
  console.log('Setting up dependencies...');
  I.cache = {};

  console.log('Removing test indexd records if they exist');
  await indexd.do.deleteFileIndices(Object.values(indexedFiles));

  console.log('Adding indexd files used to test DRS-access-based signed urls');
  const ok = await indexd.do.addFileIndices(Object.values(indexedFiles));
  expect(
    ok, 'unable to add files to indexd as part of the RAS M3 integration test setup',
  ).to.be.true;

  if (HTTP_MOCKING_ENABLED) {
    console.log(`### ## Mocking response for request against: https://${TARGET_ENVIRONMENT}/ga4gh/drs/v1/objects/${indexedFiles.drsEmbeddedPassportDataAccessTestFile1.did}/access/s3`);
    const scope = nock(`https://${TARGET_ENVIRONMENT}`)
      .post(`/ga4gh/drs/v1/objects/${indexedFiles.drsEmbeddedPassportDataAccessTestFile1.did}/access/s3`)
      .reply(200, { url: 'https://some-bucket-name-datacommons.s3.amazonaws.com/some-file.v1.vcf.gz?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AAAAAAAAAA%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20211007T162114Z&X-Amz-Expires=3600&X-Amz-Security-Token=BLABLABLA&X-Amz-SignedHeaders=host&user_id=1234&username=bob%40uchicago.edu&X-Amz-Signature=abcd1234' });

    const scope2 = nock('https://some-bucket-name-datacommons.s3.amazonaws.com')
      .get(/.*/)
      .reply(200, 'test\n');

    I.cache.scope = scope;
    I.cache.scope2 = scope2;
  }
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

Scenario('Register a fence client for RAS Test User 1 with the ga4gh_passport_v1 scope @RASJWT4DRS', async ({ I }) => {
  const { clientID, secretID } = registerRasClient(process.env.RAS_TEST_USER_1_USERNAME);
  I.cache.rasUser1ClientId = clientID;
  I.cache.rasUser1SecretId = secretID;
});

Scenario('Visit Auth URL as RAS Test User 1 and click on I Accept button @RASJWT4DRS', async ({ I }) => {
  I.amOnPage(`/user/oauth2/authorize?response_type=code&client_id=${I.cache.rasUser1ClientId}&redirect_uri=https://${process.env.HOSTNAME}/user&scope=openid+user+data+google_credentials+ga4gh_passport_v1&idp=ras`);
  await sleepMS(5000);
  I.saveScreenshot('NIH_Login_Page_user2.png');

  I.fillField('USER', process.env.RAS_TEST_USER_1_USERNAME);
  I.fillField('PASSWORD', process.env.RAS_TEST_USER_1_PASSWORD);
  I.click({ xpath: 'xpath: //button[contains(text(), \'Sign in\')]' });

  await sleepMS(3000);
  const postNIHLoginURL = await I.grabCurrentUrl();
  if (postNIHLoginURL === 'https://stsstg.nih.gov/auth/oauth/v2/authorize/consent') {
    I.click({ xpath: 'xpath: //input[@value=\'Grant\']' });
  }

  I.saveScreenshot('I_authorize_page_user1.png');
  I.waitForElement({ css: '.auth-list' }, 10);

  await I.click({ xpath: 'xpath: //button[contains(text(), \'Yes, I authorize.\')]' });

  await sleepMS(5000);
  const urlWithCode = await I.grabCurrentUrl();
  console.log(`the code: ${urlWithCode}`);

  const theCode = urlWithCode.split('=')[1];
  expect(theCode).to.not.to.be.empty;
  I.cache.rasUser1AuthCode = theCode;
});

Scenario('Obtain the passport for RAS Test User 1 @RASJWT4DRS', async ({ I }) => {
  const obtainTokensCmd = `curl --user "${I.cache.rasUser1ClientId}:${I.cache.rasUser1SecretId}" -X POST "https://${process.env.HOSTNAME}/user/oauth2/token?grant_type=authorization_code&code=${I.cache.rasUser1AuthCode}&redirect_uri=https://${process.env.HOSTNAME}/user"`;
  const obtainTokensForRASUser1 = bash.runCommand(obtainTokensCmd);
  console.log(`obtainTokensForRASUser1: ${JSON.stringify(obtainTokensForRASUser1)}`);

  const tokens = JSON.parse(obtainTokensForRASUser1);

  // decode JWT / Access Token
  const accessTokenJson = parseJwt(tokens.access_token);

  // TODO: Add assertions here to make sure the tokens are ok

  const obtainPassportCmd = `curl --request GET 'https://stsstg.nih.gov/openid/connect/v1.1/userinfo' --header "Authorization: Bearer ${tokens.access_token}"`;
  const obtainPassportForRASUser1 = bash.runCommand(obtainPassportCmd);
  console.log(`obtainPassportForRASUser1: ${JSON.stringify(obtainPassportForRASUser1)}`);
});

Scenario('Send DRS request with a single RAS ga4gh passport and confirm the access is authorized @RASJWT4DRS', async ({ I }) => {
  const drsDataAccessResp = await I.sendPostRequest(
    `https://${TARGET_ENVIRONMENT}/ga4gh/drs/v1/objects/${indexedFiles.drsEmbeddedPassportDataAccessTestFile1.did}/access/s3`,
    requestBody,
    {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  );

  console.log(`### ## drsDataAccessResp.data: ${JSON.stringify(drsDataAccessResp.data)}`);
  expect(
    drsDataAccessResp,
    'Should perform seamless AuthN and AuthZ with GA4GH RAS passport',
  ).to.have.property('status', 200);

  expect(drsDataAccessResp.data).to.have.property('url');
  if (String(drsDataAccessResp.data).includes('You don\'t have access permission on this file')) {
    expect.fail('Access denied. Could not produce a successful presigned url from the DRS data access request.');
  }

  const drsDataAccessTestFile1Resp = await I.sendGetRequest(drsDataAccessResp.data.url);
  expect(
    drsDataAccessTestFile1Resp.data,
    'could not obtain the contents of the test file from the signed url returned by the DRS data access request',
  ).to.equal(expectedContentsOfTheTestFile);
});
