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
  if (process.env.DEBUG === 'true') {
    console.log(`Access_Token: ${I.cache.ACCESS_TOKEN}`);
  }
  // upload new indexdFile
  const uploadResp = await I.sendPostRequest(
    `https://${TARGET_ENVIRONMENT}/${ras.props.indexdEndpoint}`,
    indexdFile.fileToUpload,
    assembleCustomHeaders(I.cache.ACCESS_TOKEN),
  );
  I.cache.indexdRecord = uploadResp.data.did;
  I.cache.indexdRev = uploadResp.data.rev;
  if (process.env.DEBUG === 'true') {
    console.log(`### Indexd Record DID: ${I.cache.indexdRecord}`);
  }
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

async function getTokens(I) {
  console.log('Getting the Auth Code ...');
  // &prompt=consent
  I.amOnPage(`https://${rasServerURL}/auth/oauth/v2/authorize?response_type=code&client_id=${I.cache.clientID}&prompt=consent&redirect_uri=http://localhost:8080/user/login/ras/callback&scope=${scope}&idp=ras`);
  // GET auth/oauth/v2/authorize to get the rasAuthCode
  await sleepMS(3000);
  I.saveScreenshot('rasLogin_Page.png');
  // fill in the RAS user creds
  I.fillField('USER', process.env.RAS_TEST_USER_1_USERNAME);
  I.fillField('PASSWORD', secret(process.env.RAS_TEST_USER_1_PASSWORD));
  I.waitForElement({ xpath: 'xpath: //button[contains(text(), \'Sign in\')]' }, 10);
  I.click({ xpath: 'xpath: //button[contains(text(), \'Sign in\')]' });
  // TODO -> consent page
  // /auth/oauth/v2/authorize/consent - we can make a request to /consent endpoint and it returns HTML page
  // for the request we need - action(grant/deny), sessionID and sessionData in reqBody

  // you should see the consent page in the following screenshot
  I.saveScreenshot('AfterSignIn.png');
  I.seeInCurrentURL('code');

  // after signing, the url will consist of Auth Code
  const authCodeURL = await I.grabCurrentUrl();
  if (process.env.DEBUG === 'true') {
    console.log(authCodeURL);
  }
  const url = new URL(authCodeURL);
  const authCode = url.searchParams.get('code');
  // check if the authCode isnt empty
  expect(authCode).to.not.to.be.empty;
  I.cache.rasAuthCode = authCode;
  if (process.env.DEBUG === 'true') {
    console.log(`### Auth Code = ${I.cache.rasAuthCode}`);
  }

  // getting tokens from the authCode
  console.log('Retrieving Access Token and Refresh Token ... ');
  const data = queryString.stringify({
    grant_type: 'authorization_code',
    code: `${I.cache.rasAuthCode}`,
    client_id: `${I.cache.clientID}`,
    client_secret: `${I.cache.clientSecret}`,
    scope: `${scope}`,
    redirect_uri: 'http://localhost:8080/user/login/ras/callback',
  });

  const getRASToken = await I.sendPostRequest(
    rasAuthURL,
    data,
    {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  );

  // you should get RAS tokens (id, access, refresh)
  // but you need only access_token and refresh_token for this test
  I.cache.idToken = getRASToken.data.id_token;
  I.cache.accessToken = getRASToken.data.access_token;
  I.cache.refreshToken = getRASToken.data.refresh_token;

  return I.cache.accessToken;
}

async function getPassport(I, token) {
  // const accessToken = await getTokens(I);
  // GET /openid/connect/v1.1/userinfo passport for the RAS user with RAS Access token
  const getPassportReq = await I.sendGetRequest(
    `https://${rasServerURL}/openid/connect/v1.1/userinfo`,
    {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  );
  // you should get a passport with visa as the response
  const passportBody = getPassportReq.data.passport_jwt_v11;
  // console.log(`### Passport JWT: ${passportBody}`);

  // checking the validate scope of passport
  hasScope(passportBody);
  if (hasScope(passportBody)) {
    console.log('### The Scope is correct');
  }
  return passportBody;
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
