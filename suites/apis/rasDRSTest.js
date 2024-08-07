/* eslint-disable max-len */
Feature('DRS RAS visa @requires-fence @requires-indexd');

const { expect } = require('chai');
const queryString = require('query-string');
const { performance } = require('perf_hooks');
const { Bash } = require('../../utils/bash');

const bash = new Bash();

const TARGET_ENVIRONMENT = `${process.env.NAMESPACE}.planx-pla.net`;

// RAS endpoints
const ga4ghURL = `${TARGET_ENVIRONMENT}/ga4gh/drs/v1/objects`;
// Ras Server URL
const scope = 'openid profile email ga4gh_passport_v1';
const envVars = ['RAS_TEST_USER_1_USERNAME', 'RAS_TEST_USER_1_PASSWORD', 'clientID', 'secretID'];
const permissionTestUserShouldHave = 'phs002409.c1';
const permissionTestUserShouldntHave = 'phs002410.c1';

function assembleCustomHeaders(ACCESS_TOKEN) {
  // Add ACCESS_TOKEN to custom headers
  return {
    Accept: 'application/json',
    Authorization: `bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

BeforeSuite(async ({ I }) => {
  console.log('### Setting up .. ');
  I.cache = {};

  // getting the access_token for the test user
  // test user -> cdis.autotest@gmail.com
  I.cache.ACCESS_TOKEN = await bash.runCommand('gen3 api access-token ctds.indexing.test@gmail.com');
  console.log(`Access_Token: ${I.cache.ACCESS_TOKEN}`);
  // upload new Indexd Records
  const uploadedRecords = [];
  for (const permission of [permissionTestUserShouldHave, permissionTestUserShouldntHave]) {
    const uploadResp = await I.sendPostRequest(
      `https://${TARGET_ENVIRONMENT}/index/index`,
      {
        acl: [],
        authz: [`/programs/${permission}`],
        file_name: 'ras_test_file',
        hashes: { md5: '587efb5d96f695710a8df9c0dbb96eb0' }, // pragma: allowlist secret
        size: 15,
        form: 'object',
        urls: ['s3://cdis-presigned-url-test/testdata', 'gs://cdis-presigned-url-test/testdata'],
      },
      assembleCustomHeaders(I.cache.ACCESS_TOKEN),
    );
    uploadedRecords.push(uploadResp.data);
  }
  [I.cache.accessibleIndexdRecord, I.cache.inaccessibleIndexdRecord] = uploadedRecords;
  // I.cache.inaccessibleIndexdRecord = uploadedRecords[1];
  console.log(`### Accessible Indexd Record DID: ${I.cache.accessibleIndexdRecord.did}`);
  console.log(`### Inaccessible Indexd Record DID: ${I.cache.inaccessibleIndexdRecord.did}`);
});

AfterSuite(async ({ I, ras }) => {
  // logout from the session
  console.log('Logging out ..');
  const logoutData = queryString.stringify({
    id_token: `${I.cache.idToken}`,
    client_id: `${I.cache.clientID}`,
    client_secret: `${I.cache.secretID}`,
  });
  const logoutSession = await I.sendPostRequest(
    `${ras.props.logoutRasEndpoint}`,
    logoutData,
    {
      'Content-length': 'application/x-www-form-urlencoded',
    },
  );
  if (logoutSession.status === 200) {
    console.log(`The user ${process.env.RAS_TEST_USER_1_USERNAME} has been logged out`);
  } else {
    console.log(`The user ${process.env.RAS_TEST_USER_1_USERNAME} is still logged in`);
  }

  // revoke the access for the next run
  console.log('Revoking the access ..');
  const revokeData = queryString.stringify({
    token_type_hint: 'access_token',
    token: `${I.cache.accessToken}`,
    client_id: `${I.cache.clientID}`,
    client_secret: `${I.cache.secretID}`,
    scope: `${scope}`,
  });

  const revokeReq = await I.sendPostRequest(
    `${ras.props.revokeRasEndpoint}`,
    revokeData,
    {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  );
  if (revokeReq.status === 200) {
    console.log('### The access has been revoked');
  }

  // deleting the indexd records that was created in BeforeSuite
  console.log('Deleting the indexd records ..');
  for (const record of [I.cache.accessibleIndexdRecord, I.cache.inaccessibleIndexdRecord]) {
    const deleteRecordReq = await I.sendDeleteRequest(
      `https://${TARGET_ENVIRONMENT}/index/index/${record.did}?rev=${record.rev}`,
      {
        Authorization: `Bearer ${I.cache.ACCESS_TOKEN}`,
      },
    );
    if (deleteRecordReq.status === 200) {
      console.log(`### Indexd record ${record.did} is deleted`);
    }
  }
});

// check if the creds requried for the test are defined as env variable
function validateCreds(I, testCreds) {
  testCreds.forEach((cred) => {
    if (process.env[cred] === '' || process.env[cred] === undefined) {
      throw new Error(`WARNING: Env var '${cred}' not defined!`);
    } else {
      console.log(`Env var '${cred}' is defined`);
    }
  });
  // adding the clientID and secretID to the cache
  I.cache.clientID = process.env.clientID;
  I.cache.secretID = process.env.secretID;
}

// Scenario 1 ->
Scenario('Send DRS request - Single Valid Passport Single VISA @rasDRS', async ({ I, ras }) => {
  validateCreds(I, envVars);

  const token = await ras.do.getTokens(
    I.cache.clientID,
    I.cache.secretID,
    scope,
    process.env.RAS_TEST_USER_1_USERNAME,
    process.env.RAS_TEST_USER_1_PASSWORD,
  );
  // adding the values to cache{} for later use in the test
  I.cache.accessToken = token.accessToken;
  I.cache.refreshToken = token.refreshToken;
  I.cache.idToken = token.idToken;
  I.cache.passport = await ras.do.getPassport(I.cache.accessToken);
  let drsAccessReq;
  const accessibleDRSObjectURL = `https://${ga4ghURL}/${I.cache.accessibleIndexdRecord.did}/access/s3`;
  let startTime;
  let endTime;
  const postDurations = [];
  // Valid passport -> Data access -> success, try again
  // Expect success and the retry should be faster than the first request
  for (let i = 0; i < 2; i += 1) {
    startTime = performance.now();
    drsAccessReq = await I.sendPostRequest(
      accessibleDRSObjectURL,
      {
        passports: [`${I.cache.passport}`],
      },
    );
    endTime = performance.now();
    postDurations.push(endTime - startTime);
    // verify if the response has status 200
    expect(drsAccessReq).to.have.property('status', 200);

    expect(drsAccessReq.data).to.have.property('url');
    if (String(drsAccessReq.data).includes('You don\'t have access permission on this file')) {
      expect.fail('Access Denied');
    }

    const preSignedURLReq = await I.sendGetRequest(drsAccessReq.data.url);
    expect(preSignedURLReq).to.not.be.empty;
  }
  console.log(`### First POST to ${accessibleDRSObjectURL} took ${postDurations[0]} ms`);
  console.log(`### Second POST to ${accessibleDRSObjectURL} took ${postDurations[1]} ms`);
  expect(postDurations[0]).to.be.above(postDurations[1]);
});

// Scenario 2 ->
Scenario('Send DRS request -  Single Passport Single Visa With No Permissions @rasDRS', async ({ I, ras }) => {
  const token = await ras.do.getTokens(
    I.cache.clientID,
    I.cache.secretID,
    scope,
    process.env.RAS_TEST_USER_2_USERNAME,
    process.env.RAS_TEST_USER_2_PASSWORD,
  );
  const passportWithNoPermissions = await ras.do.getPassport(token.accessToken);
  // Valid passport -> Data access -> success, try again with DIFFERENT user w/ invalid passport
  // Expect denied, should not use cached passport for a different user
  const drsAccessReq = await I.sendPostRequest(
    `https://${ga4ghURL}/${I.cache.inaccessibleIndexdRecord.did}/access/s3`,
    {
      passports: [passportWithNoPermissions],
    },
  );
  expect(drsAccessReq).to.have.property('status', 401);
});

// Scenario 3 ->
Scenario('Send DRS request - Single Passport Single Visa With Incorrect Access @rasDRS', async ({ I }) => {
  const drsAccessReq = await I.sendPostRequest(
    `https://${ga4ghURL}/${I.cache.inaccessibleIndexdRecord.did}/access/s3`,
    {
      passports: [`${I.cache.passport}`],
    },
  );
  expect(drsAccessReq).to.have.property('status', 401);
});

// Scenario 4 ->
Scenario('Send DRS request - Single Passport With Invalid Signature @rasDRS', async ({ I }) => {
  const passportParts = I.cache.passport.split('.');
  passportParts[2] = 'invalidsignature';
  I.cache.invalidPassport = passportParts.join('.');

  let drsAccessReq;
  // Invalid passport -> Data access -> denied, try again, should be denied
  // again (e.g. make sure we don’t cache invalid things)
  for (let i = 0; i < 2; i += 1) {
    drsAccessReq = await I.sendPostRequest(
      `https://${ga4ghURL}/${I.cache.accessibleIndexdRecord.did}/access/s3`,
      {
        passports: [`${I.cache.invalidPassport}`],
      },
    );
    expect(drsAccessReq).to.have.property('status', 401);
  }
});

// Scenario 5 ->
Scenario('Get Access Token from Refresh Token @rasDRS', async ({ I, ras }) => {
  validateCreds(I, envVars); // eslint-disable-line no-undef
  // get new access token from the refresh token
  // and make /userinfo call with the new access tokens
  const refreshData = queryString.stringify({
    grant_type: 'refresh_token',
    refresh_token: `${I.cache.refreshToken}`,
    scope: `${scope}`,
    client_id: `${I.cache.clientID}`,
    client_secret: `${I.cache.secretID}`,
  });

  const tokenFromRefresh = await I.sendPostRequest(
    `${ras.props.rasTokenEndpoint}`,
    refreshData,
    {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  );
  const refreshedAccessToken = tokenFromRefresh.data.access_token;

  // and send subsequent /userinfo call and also a presigned url call with the passport
  const newPassport = await ras.do.getPassport(refreshedAccessToken);

  // preSignedURL request with new passport
  const newDrsAccessReq = await I.sendPostRequest(
    `https://${ga4ghURL}/${I.cache.accessibleIndexdRecord.did}/access/s3`,
    {
      passports: [`${newPassport}`],
    },
  );

  expect(newDrsAccessReq).to.have.property('status', 200);
  const newPreSignedURLReq = await I.sendGetRequest(newDrsAccessReq.data.url);
  expect(newPreSignedURLReq).to.not.be.empty;
});
