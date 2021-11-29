/*
 CleverSafe PreSigned URL test
 This test plan has a few pre-requisites:
 - A test bucket named "fence-cleversafe-test" must be provisioned prior to the testing
 - The test user cdis.autotest must have the proper permissions configured in user.yaml
*/
Feature('CleverSafe @requires-indexd');

const { expect } = require('chai');

const expectedResult = 'test\n';

const indexedFiles = {
  cleverSafeTestFile1: {
    filename: 'test',
    link: 's3://fence-cleversafe-test/test',
    md5: 'd8e8fca2dc0f896fd7cb4cb0031ba249',
    acl: ['QA'],
    size: 5,
  },
};

BeforeSuite(async ({ indexd }) => {
  console.log('Removing test indexd records if they exist');
  await indexd.do.deleteFileIndices(Object.values(indexedFiles));

  console.log('Adding indexd files used to test signed urls');
  const ok = await indexd.do.addFileIndices(Object.values(indexedFiles));
  expect(
    ok, 'unable to add files to indexd as part of CleverSafe Test setup',
  ).to.be.true;
});

Scenario('Simple CleverSafe PreSigned URL test @cleverSafe',
  async ({
    I, fence, users,
  }) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.log('Use mainAcct to create signed URL for a test file in the Clever Safe bucket');
    const signedUrlCleverSafe = await fence.do.createSignedUrlForUser(
      indexedFiles.cleverSafeTestFile1.did, users.mainAcct.accessTokenHeader,
    );

    const cleverSafeTestFile1Resp = await I.sendGetRequest(signedUrlCleverSafe.data.url);
    expect(
      cleverSafeTestFile1Resp.data,
      'User token with access could not create signed urls and read file from Clever Safe bucket',
    ).to.equal(expectedResult);
  });
