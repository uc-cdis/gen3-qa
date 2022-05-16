/* eslint-disable max-len */
Feature('DRS RAS visa @requires-fence @requires-indexd');

const { expect } = require('chai');
const queryString = require('query-string');
const { Bash } = require('../../utils/bash');

const bash = new Bash();

const TARGET_ENVIRONMENT = `${process.env.NAMESPACE}.planx-pla.net`;

const scope = 'openid profile email ga4gh_passport_v1';

// post a indexd record before the suite
const indexdFile = {
  fileToUpload: {
    acl: [],
    authz: ['/programs/phs000710.c99'],
    file_name: 'ras_test_file',
    hashes: { md5: '587efb5d96f695710a8df9c0dbb96eb0' }, // pragma: allowlist secret
    size: 15,
    form: 'object',
    urls: ['s3://cdis-presigned-url-test/testdata', 'gs://cdis-presigned-url-test/testdata'],
  },
};

// function used in BeforeSuite to assemble the headers from the acquired access token
function assembleCustomHeaders(ACCESS_TOKEN) {
  // Add ACCESS_TOKEN to custom headers
  return {
    Accept: 'application/json',
    Authorization: `bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

// retrieve the access token for the user
// and then upload a new indexd record to the TARGET_ENVIRONMENT
BeforeSuite(async ({ I, ras }) => {
  console.log('### Setting up .. ');
  I.cache = {};

  // getting the access_token for the test user
  // test user -> cdis.autotest@gmail.com
  I.cache.ACCESS_TOKEN = await bash.runCommand('gen3 api access-token cdis.autotest@gmail.com');
  console.log(`Access_Token: ${I.cache.ACCESS_TOKEN}`);
  // upload new indexdFile
  const uploadResp = await I.sendPostRequest(
    `https://${TARGET_ENVIRONMENT}/${ras.props.indexdEndpoint}`,
    indexdFile.fileToUpload,
    assembleCustomHeaders(I.cache.ACCESS_TOKEN),
  );
  I.cache.indexdRecord = uploadResp.data.did;
  I.cache.indexdRev = uploadResp.data.rev;
  console.log(`### Indexd Record DID: ${I.cache.indexdRecord}`);
});

// after suite cleans up the indexd record, revokes the access
// and also logouts the RAS user
AfterSuite(async ({ I, ras }) => {
  // logout from the session
  console.log('Logging out ..');
  const logoutData = queryString.stringify({
    id_token: `${I.cache.idToken}`,
    client_id: `${I.cache.clientID}`,
    client_secret: `${I.cache.secretID}`,
  });
  const logoutSession = await I.sendPostRequest(
    `${ras.props.logoutRASEndpoint}`,
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

  // deleting the indexd record that was created in BeforeSuite
  console.log('Deleting the indexd record ..');
  const deleteRecordReq = await I.sendDeleteRequest(
    `https://${TARGET_ENVIRONMENT}/${ras.props.indexdEndpoint}/${I.cache.indexdRecord}?rev=${I.cache.indexdRev}`,
    {
      Authorization: `Bearer ${I.cache.ACCESS_TOKEN}`,
    },
  );
  if (deleteRecordReq.status === 200) {
    console.log('### Indexd record is deleted');
  }
});

// check if the creds required for the test are defined as env variables
function validateCreds(I, testCreds) {
  testCreds.forEach((creds) => {
    if (process.env[creds] === '' || process.env[creds] === undefined) {
      throw new Error(`Missing required environement variable '${creds}'`);
    }
  });
  // adding the clientID and secretID to the cache
  I.cache.clientID = process.env.clientID;
  I.cache.secretID = process.env.secretID;
}

// Scenario 1 ->
Scenario('Send DRS request - Single Passport Single VISA @rasDRS', async ({ I, ras }) => {
  // below is will return clientID, secretID
  validateCreds(RAS_TEST_USER_1_USERNAME, RAS_TEST_USER_1_PASSWORD, clientID, secretID); // eslint-disable-line no-undef
  // below will return accessToken, refreshToken, idToken
  const accessToken = await ras.do.getTokensWithAuthCode(I.cache.clientID, I.cache.secretID, scope);
  // caching the received tokens for further use in test
  I.cache.accessToken = accessToken.accessToken;
  I.cache.refreshToken = accessToken.refreshToken;
  I.cache.idToken = accessToken.idToken;
  // below will return passport jwt body
  const passport = await ras.do.getPassport(I.cache.accessToken);
  // checking for validate scope of the passport jwt
  const correctScope = ras.ask.hasScope(passport);
  if (correctScope) {
    console.log('### Scope is correct');
  }
  // sending DRS request with passport in body
  const drsAccessReq = await I.sendPostRequest(
    `https://${ras.props.ga4ghURL}/${I.cache.indexdRecord}/access/s3`,
    {
      passports: [`${passport}`],
    },
  );
  // verify if the response has status 200
  expect(drsAccessReq).to.have.property('status', 200);

  expect(drsAccessReq.data).to.have.property('url');
  if (String(drsAccessReq.data).includes('You don\'t have access permission on this file')) {
    expect.fail('Access Denied');
  }

  const preSignedURLReq = await I.sendGetRequest(drsAccessReq.data.url);
  expect(preSignedURLReq).to.not.be.empty;
});

// Scenario 2 ->
Scenario('Get Access Token from Refresh Token @rasDRS', async ({ I, ras }) => {
  validateCreds(RAS_TEST_USER_1_USERNAME, RAS_TEST_USER_1_PASSWORD, clientID, secretID); // eslint-disable-line no-undef
  const refreshedAccessToken = await ras.do.getTokenFromRefreshToken(I.cache.refreshToken, I.cache.clientID, I.cache.secretID, scope);

  // and send subsequent /userinfo call and also a presigned url call with the passport
  const newPassport = await ras.do.getPassport(refreshedAccessToken);

  // preSignedURL request with new passport
  const newDrsAccessReq = await I.sendPostRequest(
    `https://${ras.props.ga4ghURL}/${I.cache.indexdRecord}/access/s3`,
    {
      passports: [`${newPassport}`],
    },
  );

  expect(newDrsAccessReq).to.have.property('status', 200);
  const newPreSignedURLReq = await I.sendGetRequest(newDrsAccessReq.data.url);
  expect(newPreSignedURLReq).to.not.be.empty;
});
