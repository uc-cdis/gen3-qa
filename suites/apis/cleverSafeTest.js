/*
 CleverSafe PreSigned URL test
 This test plan has a few pre-requisites:
 - A test bucket named "fence-cleversafe-test" must be provisioned prior to the testing
 - The test user cdis.autotest must have the proper permissions configured in user.yaml
*/
Feature('CleverSafe');

const { expect } = require('chai');
const apiUtil = require('../../utils/apiUtil.js');

const expectedResult = 'test';

const indexedFiles = {
  cleverSafeTestFile1: {
    filename: 'test',
    link: 's3://fence-cleversafe-test/test',
    md5: 'd8e8fca2dc0f896fd7cb4cb0031ba249',
    acl: ['QA'],
    size: 5,
  },
};

BeforeSuite(async (indexd) => {
  console.log('Removing test indexd records if they exist');
  await indexd.do.deleteFileIndices(Object.values(indexedFiles));

  console.log('Adding indexd files used to test signed urls');
  const ok = await indexd.do.addFileIndices(Object.values(indexedFiles));
  expect(
    ok, 'unable to add files to indexd as part of CleverSafe Test setup',
  ).to.be.true;
});

Scenario('Client (with access) with user token (with access) can create signed urls for records in namespace, not outside namespace @centralizedAuth',
  async (fence, indexd, users) => {
    const accessToken = users.mainAcct.accessTokenHeader;

    console.log('Use mainAcct to create signed URL for a test file in the Clever Safe bucket');
    const signedUrlCleverSafe = await fence.do.createSignedUrlForUser(
      indexedFiles.cleverSafeTestFile1.did, apiUtil.getAccessTokenHeader(accessToken),
    );
    const cleverSafeTestFile1Contents = await fence.do.getFileFromSignedUrlRes(
      signedUrlCleverSafe,
    );
    expect(
      cleverSafeTestFile1Contents,
      'User token with access could create signed urls and read file from Clever Safe bucket',
    ).to.equal(expectedResult);
  });
