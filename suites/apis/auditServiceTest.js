Feature('AuditServiceAPI @requires-audit @requires-fence');

/**
 * Because it can take a bit of time for audit logs to be processed, we test
 * all the download scenarios in the same test, and then wait for all the
 * expected logs to be returned by the audit log query. However we split the
 * login scenarios so that we at least run the homepage login test when the RAS
 * tests are disabled (the OIDC login test depends on RAS).
 *
 * The `PULL_FREQUENCY_SECONDS` audit-service config should be set
 * to a few seconds instead of the default, so we don't wait too long.
 *
 * This test suite assumes the following access is configured:
 * - mainAcct => download access to '/programs/jnkns', no audit logs access
 * - auxAcct1 => presigned URL audit logs access
 * - auxAcct2 => login audit logs access
 */

const chai = require('chai');

const user = require('../../utils/user.js');
const { registerRasClient } = require('../../utils/rasAuthN');
const { sleepMS } = require('../../utils/apiUtil.js');

const { expect } = chai;

const files = {
  private: {
    filename: 'test_valid',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad0',
    authz: ['/programs/jnkns'],
    size: 9,
  },
  public: {
    filename: 'public_file',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad1',
    authz: ['/open'],
    size: 10,
  },
};

BeforeSuite(async ({ auditService, indexd }) => {
  await auditService.do.configureFenceAuditLogging(true); // enable

  // index the files we get presigned URLs for
  const ok = await indexd.do.addFileIndices(Object.values(files));
  expect(ok, 'Unable to index files').to.be.true;
});

AfterSuite(async ({ auditService }) => {
  try {
      await auditService.do.configureFenceAuditLogging(false); // disable
  } catch (error) {
    console.log(error);
  }
});

Scenario('Audit: download presigned URL events @audit', async ({ fence, auditService }) => {
  const timestamp = Math.floor(Date.now() / 1000); // epoch timestamp
  console.log(`Start timestamp: ${timestamp}`);
  const expectedResults = [];
  let signedUrlRes;

  // user 'mainAcct' successfully requests a presigned URL to download
  // a private file
  signedUrlRes = await fence.do.createSignedUrl(
    files.private.did,
    [],
    user.mainAcct.accessTokenHeader,
  );
  expect(signedUrlRes).to.have.property('status', 200);
  expectedResults.push({
    action: 'download',
    username: user.mainAcct.username,
    guid: files.private.did,
    status_code: 200,
  });

  // fail to request a presigned URL (unauthorized) to download
  // a private file
  signedUrlRes = await fence.do.createSignedUrl(
    files.private.did,
    [],
    {}, // no authorization header
  );
  expect(signedUrlRes).to.have.property('status', 401);
  expectedResults.push({
    action: 'download',
    username: 'anonymous',
    guid: files.private.did,
    status_code: 401,
  });

  // fail to request a presigned URL to download a file that does not exist
  signedUrlRes = await fence.do.createSignedUrl(
    '123', // fake GUID
    [],
    user.mainAcct.accessTokenHeader,
  );
  expect(signedUrlRes).to.have.property('status', 404);
  expectedResults.push({
    action: 'download',
    username: user.mainAcct.username,
    guid: '123',
    status_code: 404,
  });

  // anynymous user successfully requests a presigned URL to download
  // a public file
  signedUrlRes = await fence.do.createSignedUrl(
    files.public.did,
    [],
    {}, // no authorization header
  );
  expect(signedUrlRes).to.have.property('status', 200);
  expectedResults.push({
    action: 'download',
    username: 'anonymous',
    guid: files.public.did,
    status_code: 200,
  });

  const logCategory = 'presigned_url';
  const userTokenHeader = user.auxAcct1.accessTokenHeader;
  const params = [`start=${timestamp}`];
  await auditService.do.checkQueryResults(
    logCategory,
    userTokenHeader,
    params,
    expectedResults,
  );
}).retry(1);

Scenario('Audit: homepage login events @audit', async ({ home, auditService }) => {
  const timestamp = Math.floor(Date.now() / 1000); // epoch timestamp
  console.log(`Start timestamp: ${timestamp}`);
  const expectedResults = [];

  // user logs in
  home.do.goToHomepage();
  await home.complete.login(user.mainAcct);
  home.ask.seeDetails();
  await home.complete.logout();

  expectedResults.push({
    username: user.mainAcct.username,
    idp: 'google',
    client_id: null,
    status_code: 302,
  });

  const logCategory = 'login';
  const userTokenHeader = user.auxAcct2.accessTokenHeader;
  const params = [`start=${timestamp}`];
  await auditService.do.checkQueryResults(
    logCategory,
    userTokenHeader,
    params,
    expectedResults,
  );
}).retry(1);

Scenario('Audit: OIDC login events @audit @rasAuthN', async ({ I, auditService }) => {

  return;
  // TODO FIX
  // RAS login is broken - replace the RAS login step with another IDP and remove `@rasAuthN` tag
  // (check if fake google login creates audit logs, if not, implement ORCID login)

  const timestamp = Math.floor(Date.now() / 1000); // epoch timestamp
  console.log(`Start timestamp: ${timestamp}`);
  const expectedResults = [];

  // user logs in via the OIDC flow (IDP RAS)
  const { clientID } = registerRasClient(process.env.RAS_TEST_USER_1_USERNAME);
  I.amOnPage(`/user/oauth2/authorize?response_type=code&client_id=${clientID}&redirect_uri=https://${process.env.HOSTNAME}/user&scope=openid+user+data+google_credentials+ga4gh_passport_v1&idp=ras`);
  await sleepMS(5000);
  I.fillField('USER', process.env.RAS_TEST_USER_1_USERNAME);
  I.fillField('PASSWORD', process.env.RAS_TEST_USER_1_PASSWORD);
  I.click({ xpath: 'xpath: //button[contains(text(), \'Sign in\')]' });
  await sleepMS(3000);
  const postNIHLoginURL = await I.grabCurrentUrl();
  if (postNIHLoginURL === 'https://stsstg.nih.gov/auth/oauth/v2/authorize/consent') {
    I.click({ xpath: 'xpath: //input[@value=\'Grant\']' });
  }
  I.waitForElement({ css: '.auth-list' }, 10);
  await I.click({ xpath: 'xpath: //button[contains(text(), \'Yes, I authorize.\')]' });
  await sleepMS(5000);
  const urlWithCode = await I.grabCurrentUrl();
  const theCode = urlWithCode.split('=')[1];
  expect(theCode).to.not.to.be.empty;
  console.log('Successfully logged in');

  expectedResults.push({
    username: process.env.RAS_TEST_USER_1_USERNAME,
    idp: 'ras',
    client_id: clientID,
    status_code: 302,
  });

  const logCategory = 'login';
  const userTokenHeader = user.auxAcct2.accessTokenHeader;
  const params = [`start=${timestamp}`];
  await auditService.do.checkQueryResults(
    logCategory,
    userTokenHeader,
    params,
    expectedResults,
  );
}).retry(1);

Scenario('Audit: unauthorized log query @audit', async ({ auditService }) => {
  const timestamp = Math.floor(Date.now() / 1000); // epoch timestamp
  console.log(`Start timestamp: ${timestamp}`);
  // add a start timestamp so we don't receive lots of data back.
  // we're only interested in the status code
  const params = [`start=${timestamp}`];

  // `mainAcct` does not have access to query any audit logs
  await auditService.do.query('presigned_url', user.mainAcct.accessTokenHeader, params, 403);
  await auditService.do.query('login', user.mainAcct.accessTokenHeader, params, 403);

  // `auxAcct1` has access to query presigned_url audit logs, not login
  await auditService.do.query('presigned_url', user.auxAcct1.accessTokenHeader, params, 200);
  await auditService.do.query('login', user.auxAcct1.accessTokenHeader, params, 403);

  // `auxAcct2` has access to query login audit logs, not presigned_url
  await auditService.do.query('presigned_url', user.auxAcct2.accessTokenHeader, params, 403);
  await auditService.do.query('login', user.auxAcct2.accessTokenHeader, params, 200);
}).retry(1);
