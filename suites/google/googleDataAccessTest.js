/*eslint-disable */
Feature('GoogleDataAccess');
/*
Test a full flow for a user accessing data on Google. Also test that when permissions
change on the User Access file, the user's access to data on Google changes correctly.

- Sync a User Access File
- Generate temporary Google credentials
- Generate signed URLs
- Use credentials and signed URLs to read file(s)
  - make sure they get 403's for files users should NOT have access
  - make sure they CAN receive the files that they should

User Access Files and which projects the users have access to:

  Normal usersync against common-users qa/user.yaml =>
    User0
      - QA
    User1
      - QA
      - test
    User2
      -

  Commons.userAccessFiles.newUserAccessFile2 =>
    User0
      -
    User1
      - test
    User2
      - QA
*/

const chai = require('chai');
const { Commons } = require('../../utils/commons.js');
const fenceProps = require('../../services/apis/fence/fenceProps.js');
const { Bash } = require('../../utils/bash.js');
const {
  checkPod,
  getAccessToken,
  getAccessTokenHeader,
  Gen3Response,
  sleepMS,
} = require('../../utils/apiUtil.js');

const bash = new Bash();

const fs = require('fs');
const stringify = require('json-stringify-safe');

const indexed_files = {
  qaFile: {
    filename: fenceProps.googleBucketInfo.QA.fileName,
    link: `gs://${fenceProps.googleBucketInfo.QA.bucketId}/${fenceProps.googleBucketInfo.QA.fileName}`,
    md5: '73d643ec3f4beb9020eef0beed440ad0',
    acl: ['QA'],
    size: 9,
  },
  testFile: {
    filename: fenceProps.googleBucketInfo.test.fileName,
    link: `gs://${fenceProps.googleBucketInfo.test.bucketId}/${fenceProps.googleBucketInfo.test.fileName}`,
    md5: '73d643ec3f4beb9020eef0beed440ad1',
    acl: ['test'],
    size: 10,
  },
};

const googleDataAccessTestSteps = async (I, fence, user, google, files, paramsQA1, paramsTest1, paramsQA2, paramsTest2) => {
  console.log('*** RUN USERSYNC JOB ***');
  bash.runJob('usersync', args = 'FORCE true');
  await checkPod(I, 'usersync', 'gen3job,job-name=usersync');

  console.log('*** UNLINK AND LINK GOOGLE ACCOUNT ***');
  await fence.complete.forceUnlinkGoogleAcct(user);
  await fence.complete.linkGoogleAcctMocked(user);

  console.log(`*** CREATE TEMP GOOGLE CREDS FOR USER ${user.username} AND SAVE TO TEMP FILE ***`);
  const tempCredsRes = await fence.complete.createTempGoogleCreds(
    user.accessTokenHeader,
  );
  const credsKey = tempCredsRes.data.private_key_id;
  const pathToCredsKeyFile = `${credsKey}.json`;
  await files.createTmpFile(pathToCredsKeyFile, JSON.stringify(tempCredsRes.data));

  console.log('*** CREATE SIGNED URLS IN QA AND TEST ***');
  const signedUrlQA1Res = await fence.do.createSignedUrlForUser(
    indexed_files.qaFile.did, user.accessTokenHeader,
  );
  const signedUrlTest1Res = await fence.do.createSignedUrlForUser(
    indexed_files.testFile.did, user.accessTokenHeader,
  );

  console.log('*** ACCESS GOOGLE BUCKET FOR QA AND TEST ***');
  const userAccessQA1Res = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToCredsKeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName,
    paramsQA1
  );
  const userAccessTest1Res = await google.getFileFromBucket(
    fence.props.googleBucketInfo.test.googleProjectId,
    pathToCredsKeyFile,
    fence.props.googleBucketInfo.test.bucketId,
    fence.props.googleBucketInfo.test.fileName,
    paramsTest1
  );

  console.log(`*** RUN USERYAML WITH ${Commons.userAccessFiles.newUserAccessFile2} ***`);
  Commons.setUserYaml(Commons.userAccessFiles.newUserAccessFile2);
  bash.runJob('useryaml');
  await checkPod(I, 'useryaml', 'gen3job,job-name=useryaml');
  await sleepMS(30000);

  console.log(`*** RE-CREATE TEMP GOOGLE CREDS FOR USER ${user.username} AND SAVE TO TEMP FILE ***`);
  const tempCredsRes2 = await fence.complete.createTempGoogleCreds(
    user.accessTokenHeader,
  );
  const credsKey2 = tempCredsRes2.data.private_key_id;
  const pathToCredsKeyFile2 = `${credsKey2}.json`;
  await files.createTmpFile(pathToCredsKeyFile2, JSON.stringify(tempCredsRes2.data));

  console.log('*** CREATE SIGNED URLS AGAIN IN QA AND TEST ***');
  const signedUrlQA2Res = await fence.do.createSignedUrlForUser(
    indexed_files.qaFile.did, user.accessTokenHeader,
  );
  const signedUrlTest2Res = await fence.do.createSignedUrlForUser(
    indexed_files.testFile.did, user.accessTokenHeader,
  );

  console.log('*** ACCESS GOOGLE BUCKET AGAIN TO QA AND TEST ***');
  const userAccessQA2Res = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToCredsKeyFile2,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName,
    paramsQA2
  );
  const userAccessTest2Res = await google.getFileFromBucket(
    fence.props.googleBucketInfo.test.googleProjectId,
    pathToCredsKeyFile2,
    fence.props.googleBucketInfo.test.bucketId,
    fence.props.googleBucketInfo.test.fileName,
    paramsTest2
  );

  return [
    signedUrlQA1Res, signedUrlTest1Res, userAccessQA1Res, userAccessTest1Res,
    signedUrlQA2Res, signedUrlTest2Res, userAccessQA2Res, userAccessTest2Res
  ]
}

BeforeSuite(async ({ indexd, fence, google, users }) => {
  try {
    console.log('Adding indexd files used to test signed urls');
    await indexd.do.addFileIndices(Object.values(indexed_files));
    console.log('deleting keys for SA associated with users 0, 1 and user2...');
    ['user0', 'user1', 'user2'].forEach(async(user) => {
      const getCredsRes = await fence.do.getUserGoogleCreds(users[user].accessTokenHeader);
      await google.deleteSAKeys(user, getCredsRes.access_keys);
    });
  } catch (error) {
    console.log(error);
  }
});

AfterSuite(async ({ I, indexd }) => {
  try {
    console.log('Removing indexd files used to test signed urls');
    await indexd.do.deleteFileIndices(Object.values(indexed_files));

    console.log('Running usersync job');
    bash.runJob('usersync', args = 'FORCE true');
    await checkPod(I, 'usersync', 'gen3job,job-name=usersync');
  } catch (error) {
    console.log(error);
  }
});

Scenario('Test Google Data Access User0 @reqGoogle @googleDataAccess @manual',
  async ({ I, fence, users, google, files }) => {
    const result = await googleDataAccessTestSteps(
      I, fence, users.user0, google, files,
      { nAttempts: 1, expectAccessDenied: false }, // paramsQA1
      { nAttempts: 3, expectAccessDenied: true }, // paramsTest1
      { nAttempts: 3, expectAccessDenied: true }, // paramsQA2
      { nAttempts: 3, expectAccessDenied: true } // paramsTest2
    )
    console.log(Date.now());
    await sleepMS(60000);
    console.log(Date.now());
    console.log('*** VALIDATE RESULT ***');
    // Signed URL for QA - First Run
    chai.expect(result[0]).to.have.property('status', 200);
    // Signed URL for test - First Run
    chai.expect(result[1]).to.have.property('status', 401);
    // Bucket Access for QA - First Run
    chai.expect(result[2]).to.have.property('id');
    // Bucket Access for test - First Run
    chai.expect(result[3]).to.have.property('status', 403);
    // Signed URL for QA - Second Run
    chai.expect(result[4]).to.have.property('status', 401);
    // Signed URL for test - Second Run
    chai.expect(result[5]).to.have.property('status', 401);
    // Bucket Access for QA - Second Run
    chai.expect(result[6]).to.have.property('status', 403);
    // Bucket Access for test - Second Run
    chai.expect(result[7]).to.have.property('status', 403);
  }
);

Scenario('Test Google Data Access User1 @reqGoogle @googleDataAccess @manual',
  async ({ I, fence, users, google, files }) => {
    const result = await googleDataAccessTestSteps(
      I, fence, users.user1, google, files,
      { nAttempts: 1, expectAccessDenied: false }, // paramsQA1
      { nAttempts: 1, expectAccessDenied: false }, // paramsTest1
      { nAttempts: 3, expectAccessDenied: true }, // paramsQA2
      { nAttempts: 1, expectAccessDenied: false } // paramsTest2
    )
    console.log(Date.now());
    await sleepMS(60000);
    console.log(Date.now());
    console.log('*** VALIDATE RESULT ***');
    // Signed URL for QA - First Run
    chai.expect(result[0]).to.have.property('status', 200);
    // Signed URL for test - First Run
    chai.expect(result[1]).to.have.property('status', 200);
    // Bucket Access for QA - First Run
    chai.expect(result[2]).to.have.property('id');
    // Bucket Access for test - First Run
    chai.expect(result[3]).to.have.property('id');
    // Signed URL for QA - Second Run
    chai.expect(result[4]).to.have.property('status', 401);
    // Signed URL for test - Second Run
    chai.expect(result[5]).to.have.property('status', 200);
    // Bucket Access for QA - Second Run
    chai.expect(result[6]).to.have.property('status', 403);
    // Bucket Access for test - Second Run
    chai.expect(result[7]).to.have.property('id');
  }
);

Scenario('Test Google Data Access User2 @reqGoogle @googleDataAccess',
  async ({ I, fence, users, google, files }) => {
    const result = await googleDataAccessTestSteps(
      I, fence, users.user2, google, files,
      { nAttempts: 3, expectAccessDenied: true }, // paramsQA1
      { nAttempts: 3, expectAccessDenied: true }, // paramsTest1
      { nAttempts: 1, expectAccessDenied: false }, // paramsQA2
      { nAttempts: 1, expectAccessDenied: false } // paramsTest2
    )
    console.log(Date.now());
    await sleepMS(60000);
    console.log(Date.now());
    console.log('*** VALIDATE RESULT ***');
    // Signed URL for QA - First Run
    chai.expect(result[0]).to.have.property('status', 401);
    // Signed URL for test - First Run
    chai.expect(result[1]).to.have.property('status', 401);
    // Bucket Access for QA - First Run
    chai.expect(result[2]).to.have.property('status', 403);
    // Bucket Access for test - First Run
    chai.expect(result[3]).to.have.property('status', 403);
    // Signed URL for QA - Second Run
    chai.expect(result[4]).to.have.property('status', 200);
    // Signed URL for test - Second Run
    chai.expect(result[5]).to.have.property('status', 401);
    // Bucket Access for QA - Second Run
    chai.expect(result[6]).to.have.property('id');
    // Bucket Access for test - Second Run
    chai.expect(result[7]).to.have.property('status', 403);
  }
);
