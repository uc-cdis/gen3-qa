Feature('AuditServiceAPI');

/**
 * Because it can take a bit of time for audit logs to be processed, we test
 * all the download scenarios in the same test, and then wait for all the
 * expected logs to be returned by the audit log query (same for the login
 * scenarios).
 * The `PULL_FREQUENCY_SECONDS` audit-service config should be set
 * to a few seconds instead of the default, so we don't wait too long.

 * This test suite assumes the following access is configured:
 * - mainAcct => download access, no audit logs access
 * - auxAcct1 => presigned URL audit logs access
 * - auxAcct2 => login audit logs access
 */

const chai = require('chai');
const { expect } = chai;
const user = require('../../utils/user.js');

const files = {
    private: {
        filename: 'test_valid',
        link: 's3://cdis-presigned-url-test/testdata',
        md5: '73d643ec3f4beb9020eef0beed440ad0',
        authz: ['/programs/jenkins'],
        size: 9,
    },
    public: {
        filename: 'public_file',
        link: 's3://cdis-presigned-url-test/testdata',
        md5: '73d643ec3f4beb9020eef0beed440ad1',
        authz: ['/open'],
        size: 10,
    },
}

BeforeSuite(async ({ indexd }) => {
    // index the files we get presigned URLs for
    const ok = await indexd.do.addFileIndices(Object.values(files));
    expect(ok, 'Unable to index files').to.be.true;
});

Scenario('Audit: download presigned URL events', async ({ fence, auditService }) => {
    const timestamp = Math.floor(Date.now() / 1000); // epoch timestamp
    const expectedResults = [];
    let signedUrlRes;

    // user 'mainAcct' successfully requests a presigned URL to download
    // a private file
    signedUrlRes = await fence.do.createSignedUrl(
        files.private.did,
        [],
        user.mainAcct.accessTokenHeader,
    );
    expect(signedUrlRes).to.have.property('status', 401); // TODO 200
    expectedResults.push({
        action: 'download',
        username: user.mainAcct.username,
        guid: files.private.did,
        status_code: 401, // TODO 200
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

    // fail to request a presigned URL to download a file that does not exit
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
    expect(signedUrlRes).to.have.property('status', 401); // TODO 200
    expectedResults.push({
        action: 'download',
        username: 'anonymous',
        guid: files.private.did,
        status_code: 401, // TODO 200
    });
  
    const logCategory = 'presigned_url';
    const userTokenHeader = user.auxAcct1.accessTokenHeader;
    const params = [`start=${timestamp}`];
    await auditService.do.checkQueryResults(logCategory, userTokenHeader, params, expectedResults.length, expectedResults);
});

/**
 * atm we do not test a login event via an OIDC client, only a login event
 * on the data-portal homepage
 */
Scenario('Audit: login events', async ({ home, auditService }) => {
    const timestamp = Math.floor(Date.now() / 1000); // epoch timestamp
    const expectedResults = [];

    // user logs in
    home.do.goToHomepage();
    home.complete.login(user.mainAcct);
    home.ask.seeDetails();
    home.complete.logout();
    expectedResults.push({
        username: user.mainAcct.username,
        idp: 'google',
        client_id: null,
        status_code: 302,
    });

    const logCategory = 'login';
    const userTokenHeader = user.auxAcct2.accessTokenHeader;
    const params = [`start=${timestamp}`];
    await auditService.do.checkQueryResults(logCategory, userTokenHeader, params, expectedResults.length, expectedResults);
});

Scenario('Audit: unauthorized log query', async ({ auditService }) => {
    const timestamp = Math.floor(Date.now() / 1000); // epoch timestamp
    // add a start timestamp so we don't receive lots of data back.
    // we're only interested in the status code
    const params = [`start=${timestamp}`];

    // `mainAcct` does not have access to query any audit logs
    await auditService.do.query('presigned_url', user.mainAcct.accessTokenHeader, [], 403);
    await auditService.do.query('login', user.mainAcct.accessTokenHeader, params, 403);

    // `auxAcct1` has access to query presigned_url audit logs, not login
    await auditService.do.query('presigned_url', user.auxAcct1.accessTokenHeader, [], 200);
    await auditService.do.query('login', user.auxAcct1.accessTokenHeader, params, 403);

    // `auxAcct2` has access to query login audit logs, not presigned_url
    await auditService.do.query('presigned_url', user.auxAcct2.accessTokenHeader, [], 403);
    await auditService.do.query('login', user.auxAcct2.accessTokenHeader, params, 200);
});
