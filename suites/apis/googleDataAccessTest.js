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


NOTE: This is a giant test that asserts a lot of things. Why not multiple tests?
      Because usersync and useryaml jobs take a very long time. If we had to run
      them in b/t every test, this suite would take ten-fold or more time than
      it currently does.

      To compensate for the potential annoyance of "what actually failed?!" when this
      fails, we've added a ton of console.logs along the way so you know where the test
      got to. All assertions should also provide detailed information about failures.
*/
const { Commons } = require('../../utils/commons.js');
const chai = require('chai');
const fenceProps = require('../../services/apis/fence/fenceProps.js');
const { Bash } = require('../../utils/bash.js');
const apiUtil = require('../../utils/apiUtil.js');

const bash = new Bash();

const fs = require('fs');

const I = actor();

const indexed_files = {
  qaFile: {
    filename: fenceProps.googleBucketInfo.QA.fileName,
    link: 'gs://' + fenceProps.googleBucketInfo.QA.bucketId + '/' + fenceProps.googleBucketInfo.QA.fileName,
    md5: '73d643ec3f4beb9020eef0beed440ad0',
    acl: ['QA'],
    size: 9,
  },
  testFile: {
    filename: fenceProps.googleBucketInfo.test.fileName,
    link: 'gs://' + fenceProps.googleBucketInfo.test.bucketId + '/' + fenceProps.googleBucketInfo.test.fileName,
    md5: '73d643ec3f4beb9020eef0beed440ad1',
    acl: ['test'],
    size: 10,
  }
}

BeforeSuite(async (fence, users, indexd) => {
  console.log('Ensure test buckets are linked to projects in this commons...\n');
  const namespace = process.env.NAMESPACE

  var bucketId = fence.props.googleBucketInfo.QA.bucketId
  var googleProjectId = fence.props.googleBucketInfo.QA.googleProjectId
  var projectAuthId = 'QA'
  var fenceCmd = `fence-create google-bucket-create --unique-name ${bucketId} --google-project-id ${googleProjectId} --project-auth-id ${projectAuthId} --public False`;
  console.log(`Running: ${fenceCmd}`)
  var response = bash.runCommand(fenceCmd, 'fence');

  bucketId = fence.props.googleBucketInfo.test.bucketId
  googleProjectId = fence.props.googleBucketInfo.test.googleProjectId
  projectAuthId = 'test'
  fenceCmd = `fence-create google-bucket-create --unique-name ${bucketId} --google-project-id ${googleProjectId} --project-auth-id ${projectAuthId} --public False`;
  console.log(`Running: ${fenceCmd}`)
  response = bash.runCommand(fenceCmd, 'fence');

  console.log('Clean up Google Bucket Access Groups from previous runs...\n');
  bash.runJob('google-verify-bucket-access-group');

  console.log('Adding indexd files used to test signed urls');
  const ok = await indexd.do.addFileIndices(Object.values(indexed_files));
  chai.expect(ok).to.be.true;
});

AfterSuite(async (fence, indexd, users) => {
  console.log(`Running usersync job`);
  bash.runJob('usersync');
  console.log('Removing indexd files used to test signed urls');
  await indexd.do.deleteFileIndices(Object.values(indexed_files));
});

After(async (fence, users) => {
  // Cleanup after each scenario
  const unlinkResults = Object.values(users).map(user => fence.do.unlinkGoogleAcct(user));
  await Promise.all(unlinkResults);
});

Scenario('Test Google Data Access (signed urls and temp creds) @reqGoogle @googleDataAccess',
  async (fence, users, google, files) => {
  console.log('make sure users google accounts are unlinked');
  await fence.complete.forceUnlinkGoogleAcct(users.user0);
  await fence.complete.forceUnlinkGoogleAcct(users.user1);
  await fence.complete.forceUnlinkGoogleAcct(users.user2);

  console.log('linking users google accounts');
  await fence.complete.linkGoogleAcctMocked(users.user0);
  await fence.complete.linkGoogleAcctMocked(users.user1);
  await fence.complete.linkGoogleAcctMocked(users.user2);

  console.log(`creating temporary google creds for users with usernames:  ${users.user0.username}, ${users.user1.username}, ${users.user2.username}`);
  // call our endpoint to get temporary creds
  // NOTE: If this fails and you don't know why, it *might* be that we've hit our limit
  //       for SA keys on this user's Google Service Account. They *should* be cleaned
  //       up after every test but if they aren't, you need to delete the keys from the
  //       fence database (in table google_service_account_keys) AND delete them from
  //       the Google Cloud Platform. Check usersUtil.js for information about these users
  //       (specifically their username is their Google Account email, you can use that
  //        to find their service account in the GCP)
  const tempCreds0Res = await fence.complete.createTempGoogleCreds(
    users.user0.accessTokenHeader);
  const tempCreds1Res = await fence.complete.createTempGoogleCreds(
    users.user1.accessTokenHeader);
  const tempCreds2Res = await fence.complete.createTempGoogleCreds(
    users.user2.accessTokenHeader);

  console.log('Use User0 to create signed URL for file in QA')
  const User0signedUrlQA1Res = await fence.do.createSignedUrlForUser(
    indexed_files.qaFile.did, users.user0.accessTokenHeader);
  let User0signedUrlQA1FileContents = await fence.do.getGoogleFileFromSignedUrlRes(
    User0signedUrlQA1Res);

  console.log('Use User1 to create signed URL for file in QA')
  const User1signedUrlQA1Res = await fence.do.createSignedUrlForUser(
    indexed_files.qaFile.did, users.user1.accessTokenHeader);
  let User1signedUrlQA1ResFileContents = await fence.do.getGoogleFileFromSignedUrlRes(
    User1signedUrlQA1Res);

  console.log('Use User2 to create signed URL for file in QA')
  const User2signedUrlQA1Res = await
  fence.do.createSignedUrlForUser(
    indexed_files.qaFile.did, users.user2.accessTokenHeader);

  console.log('Use User0 to create signed URL for file in test')
  const User0signedUrlTest1Res = await fence.do.createSignedUrlForUser(
    indexed_files.testFile.did, users.user0.accessTokenHeader);

  console.log('Use User1 to create signed URL for file in test')
  const User1signedUrlTest1Res = await fence.do.createSignedUrlForUser(
    indexed_files.testFile.did, users.user1.accessTokenHeader);
  let User1signedUrlTest1ResFileContents = await fence.do.getGoogleFileFromSignedUrlRes(
    User1signedUrlTest1Res);

  console.log('Use User2 to create signed URL for file in test')
  const User2signedUrlTest1Res = await fence.do.createSignedUrlForUser(
    indexed_files.testFile.did, users.user2.accessTokenHeader);

  console.log('saving temporary google creds to file');
  const creds0Key = tempCreds0Res.body.private_key_id;
  const creds1Key = tempCreds1Res.body.private_key_id;
  const creds2Key = tempCreds2Res.body.private_key_id;
  const pathToCreds0KeyFile = creds0Key + '.json';
  const pathToCreds1KeyFile = creds1Key + '.json';
  const pathToCreds2KeyFile = creds2Key + '.json';

  await files.createTmpFile(pathToCreds0KeyFile, JSON.stringify(tempCreds0Res.body));
  console.log(`Google creds file ${pathToCreds0KeyFile} saved!`);

  await files.createTmpFile(pathToCreds1KeyFile, JSON.stringify(tempCreds1Res.body));
  console.log(`Google creds file ${pathToCreds1KeyFile} saved!`);

  await files.createTmpFile(pathToCreds2KeyFile, JSON.stringify(tempCreds2Res.body));
  console.log(`Google creds file ${pathToCreds2KeyFile} saved!`);

  console.log('using saved google creds to access google bucket!! Save responses to check later');
  // use Google's client libraries to attempt to read a controlled access file with the
  // creds we just saved (based on the user's permissions)
  // attempt to access a file in the bucket
  user0AccessQA1Res = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToCreds0KeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName
  );
  user0AccessTest1Res = await google.getFileFromBucket(
    fence.props.googleBucketInfo.test.googleProjectId,
    pathToCreds0KeyFile,
    fence.props.googleBucketInfo.test.bucketId,
    fence.props.googleBucketInfo.test.fileName
  );
  user1AccessQA1Res = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToCreds1KeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName
  );
  user1AccessTest1Res = await google.getFileFromBucket(
    fence.props.googleBucketInfo.test.googleProjectId,
    pathToCreds1KeyFile,
    fence.props.googleBucketInfo.test.bucketId,
    fence.props.googleBucketInfo.test.fileName
  );
  user2AccessQA1Res = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToCreds2KeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName
  );
  user2AccessTest1Res = await google.getFileFromBucket(
    fence.props.googleBucketInfo.test.googleProjectId,
    pathToCreds2KeyFile,
    fence.props.googleBucketInfo.test.bucketId,
    fence.props.googleBucketInfo.test.fileName
  );

  console.log(`Running useryaml job with ${Commons.userAccessFiles.newUserAccessFile2}`);
  Commons.setUserYaml(Commons.userAccessFiles.newUserAccessFile2);
  bash.runJob('useryaml-job');

  // get new access tokens b/c of changed access
  newUser0AccessToken = apiUtil.getAccessToken(users.user0.username, 3600);
  newUser1AccessToken = apiUtil.getAccessToken(users.user1.username, 3600);
  newUser2AccessToken = apiUtil.getAccessToken(users.user2.username, 3600);

  console.log('using saved google creds to access google bucket!! Save responses to check later');
  // use Google's client libraries to attempt to read a controlled access file with the
  // creds we just saved (based on the user's permissions)
  // attempt to access a file in the bucket
  user0AccessQA2Res = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToCreds0KeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName
  );
  user0AccessTest2Res = await google.getFileFromBucket(
    fence.props.googleBucketInfo.test.googleProjectId,
    pathToCreds0KeyFile,
    fence.props.googleBucketInfo.test.bucketId,
    fence.props.googleBucketInfo.test.fileName
  );
  user1AccessQA2Res = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToCreds1KeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName
  );
  user1AccessTest2Res = await google.getFileFromBucket(
    fence.props.googleBucketInfo.test.googleProjectId,
    pathToCreds1KeyFile,
    fence.props.googleBucketInfo.test.bucketId,
    fence.props.googleBucketInfo.test.fileName
  );
  user2AccessQA2Res = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToCreds2KeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName
  );
  user2AccessTest2Res = await google.getFileFromBucket(
    fence.props.googleBucketInfo.test.googleProjectId,
    pathToCreds2KeyFile,
    fence.props.googleBucketInfo.test.bucketId,
    fence.props.googleBucketInfo.test.fileName
  );

  console.log('Use User0 to create signed URL for file in QA')
  const User0signedUrlQA2Res = await fence.do.createSignedUrlForUser(
    indexed_files.qaFile.did, {
      Accept: 'application/json',
      Authorization: `bearer ${newUser0AccessToken}`,
    });

  console.log('Use User1 to create signed URL for file in QA')
  const User1signedUrlQA2Res = await fence.do.createSignedUrlForUser(
    indexed_files.qaFile.did, {
      Accept: 'application/json',
      Authorization: `bearer ${newUser1AccessToken}`,
    });

  console.log('Use User2 to create signed URL for file in QA')
  const User2signedUrlQA2Res = await fence.do.createSignedUrlForUser(
    indexed_files.qaFile.did, {
      Accept: 'application/json',
      Authorization: `bearer ${newUser2AccessToken}`,
    });
  let User2signedUrlQA2ResFileContents = await fence.do.getGoogleFileFromSignedUrlRes(
    User2signedUrlQA2Res);

  console.log('Use User0 to create signed URL for file in test')
  const User0signedUrlTest2Res = await fence.do.createSignedUrlForUser(
    indexed_files.testFile.did, {
      Accept: 'application/json',
      Authorization: `bearer ${newUser0AccessToken}`,
    });

  console.log('Use User1 to create signed URL for file in test')
  const User1signedUrlTest2Res = await fence.do.createSignedUrlForUser(
    indexed_files.testFile.did, {
      Accept: 'application/json',
      Authorization: `bearer ${newUser1AccessToken}`,
    });
  let User1signedUrlTest2ResFileContents = await fence.do.getGoogleFileFromSignedUrlRes(
    User1signedUrlTest2Res);

  console.log('Use User2 to create signed URL for file in test')
  const User2signedUrlTest2Res = await fence.do.createSignedUrlForUser(
    indexed_files.testFile.did, {
      Accept: 'application/json',
      Authorization: `bearer ${newUser2AccessToken}`,
    });

  // use old signed urls to try and access data again
  console.log('Use signed URL from User0 to try and access QA data again')
  let User0AccessRemovedQA = await fence.do.getGoogleFileFromSignedUrlRes(
    User0signedUrlQA1Res);

  console.log('Use signed URL from User1 to try and access QA data again')
  let User1AccessRemovedQA = await fence.do.getGoogleFileFromSignedUrlRes(
    User1signedUrlQA1Res);

  console.log('Use signed URL from User1 to try and access test data again')
  let User1AccessRemainsTest = await fence.do.getGoogleFileFromSignedUrlRes(
    User1signedUrlTest1Res);

  console.log('deleting temporary google credentials');
  // call our endpoint to delete temporary creds
  const deleteCreds0Res = await fence.do.deleteTempGoogleCreds(
    creds0Key, users.user0.accessTokenHeader);
  const deleteCreds1Res = await fence.do.deleteTempGoogleCreds(
    creds1Key, users.user1.accessTokenHeader);
  const deleteCreds2Res = await fence.do.deleteTempGoogleCreds(
    creds2Key, users.user2.accessTokenHeader);

  console.log('test cleanup: deleting google service accounts from google');
  const deleteServiceAccount0Res = await google.deleteServiceAccount(
    tempCreds0Res.body.project_id, tempCreds0Res.body.client_email);
  const deleteServiceAccount1Res = await google.deleteServiceAccount(
    tempCreds1Res.body.project_id, tempCreds1Res.body.client_email);
  const deleteServiceAccount2Res = await google.deleteServiceAccount(
    tempCreds2Res.body.project_id, tempCreds2Res.body.client_email);

  console.log('deleting temporary google credentials file');
  files.deleteFile(pathToCreds0KeyFile);
  console.log(`${pathToCreds0KeyFile} deleted!`);

  files.deleteFile(pathToCreds1KeyFile);
  console.log(`${pathToCreds1KeyFile} deleted!`);

  files.deleteFile(pathToCreds2KeyFile);
  console.log(`${pathToCreds2KeyFile} deleted!`);

  // FIRST RUN
  //  - Check Temporary Service Account Creds
  console.log('Make assertions for user access for first run');
  console.log('First: Check temporary service account credentials');

  chai.expect(user0AccessQA1Res,
    'First sync: Check User0 access bucket for project: QA. FAILED.'
  ).to.have.property('id');
  chai.expect(user0AccessTest1Res,
    'First sync: Check User0 CAN NOT access bucket for project: test. FAILED.'
  ).to.have.property('statusCode', 403);

  chai.expect(user1AccessQA1Res,
    'First sync: Check User1 access bucket for project: QA. FAILED.'
  ).to.have.property('id');
  chai.expect(user1AccessTest1Res,
    'First sync: Check User1 access bucket for project: test. FAILED.'
  ).to.have.property('id');

  chai.expect(user2AccessQA1Res,
    'First sync: Check User2 access CAN NOT bucket for project: QA. FAILED.'
  ).to.have.property('statusCode', 403);
  chai.expect(user2AccessTest1Res,
    'First sync: Check User2 access CAN NOT bucket for project: test. FAILED.'
  ).to.have.property('statusCode', 403);

  // FIRST RUN
  //  - Check Signed URLs
  console.log('Second: Check signed URLs');

  chai.expect(User0signedUrlQA1FileContents,
    "First sync: Check User0 can use signed URL to read file in QA. FAILED."
  ).to.equal(fence.props.googleBucketInfo.QA.fileContents);

  chai.expect(User1signedUrlQA1ResFileContents,
    "First sync: Check User1 can use signed URL to read file in QA. FAILED."
  ).to.equal(fence.props.googleBucketInfo.QA.fileContents);

  chai.expect(User2signedUrlQA1Res,
    'First sync: Check that User2 could NOT get a signed URL to read file in QA. FAILED.'
  ).to.have.property('statusCode', 401);

  chai.expect(User0signedUrlTest1Res,
    'First sync: Check that User0 could NOT get a signed URL to read file in test. FAILED.'
  ).to.have.property('statusCode', 401);

  chai.expect(User1signedUrlTest1ResFileContents,
    "First sync: Check User1 can use signed URL to read file in test. FAILED."
  ).to.equal(fence.props.googleBucketInfo.test.fileContents);

  chai.expect(User2signedUrlTest1Res,
    'First sync: Check that User2 could NOT get a signed URL to read file in test. FAILED.'
  ).to.have.property('statusCode', 401);

  // SECOND RUN (new authZ)
  //  - Check Temporary Service Account Creds
  console.log('Make assertions for user access for second run (after new usersync)');
  console.log('First: Check temporary service account credentials');

  chai.expect(user0AccessQA2Res,
    '2nd sync: Check User0 CAN NOT access bucket for project: QA. FAILED.'
  ).to.have.property('statusCode', 403);
  chai.expect(user0AccessTest2Res,
    '2nd sync: Check User0 CAN NOT access bucket for project: test. FAILED.'
  ).to.have.property('statusCode', 403);

  chai.expect(user1AccessQA2Res,
    '2nd sync: Check User1 CAN NOT access bucket for project: QA. FAILED.'
  ).to.have.property('statusCode', 403);
  chai.expect(user1AccessTest2Res,
    '2nd sync: Check User1 access bucket for project: test. FAILED.'
  ).to.have.property('id');

  chai.expect(user2AccessQA2Res,
    '2nd sync: Check User2 access bucket for project: QA. FAILED.'
  ).to.have.property('id');
  chai.expect(user2AccessTest2Res,
    '2nd sync: Check User2 access CAN NOT bucket for project: test. FAILED.'
  ).to.have.property('statusCode', 403);

  // SECOND RUN (new authZ)
  //  - Check Signed URLs from SECOND RUN
  console.log('Second: Check signed URLs');

  chai.expect(User1signedUrlQA2Res,
    '2nd sync: Check that User1 could NOT get a signed URL to read file in QA. FAILED.'
  ).to.have.property('statusCode', 401);

  chai.expect(User0signedUrlQA2Res,
    '2nd sync: Check that User0 could NOT get a signed URL to read file in QA. FAILED.'
  ).to.have.property('statusCode', 401);

  chai.expect(User2signedUrlQA2ResFileContents,
    "2nd sync: Check User2 can use signed URL to read file in QA. FAILED."
  ).to.equal(fence.props.googleBucketInfo.QA.fileContents);

  chai.expect(User0signedUrlTest2Res,
    '2nd sync: Check that User0 could NOT get a signed URL to read file in test. FAILED.'
  ).to.have.property('statusCode', 401);

  chai.expect(User1signedUrlTest2ResFileContents,
    "2nd sync: Check User1 can use signed URL to read file in test. FAILED."
  ).to.equal(fence.props.googleBucketInfo.test.fileContents);

  chai.expect(User2signedUrlTest2Res,
    '2nd sync: Check that User2 could NOT get a signed URL to read file in test. FAILED.'
  ).to.have.property('statusCode', 401);

  // SECOND RUN
  //  - Check signed URLs from FIRST RUN
  chai.expect(User0AccessRemovedQA,
    "Make sure signed URL from User0 CANNOT access QA data again. FAILED."
  ).to.contain('AccessDenied');

  chai.expect(User1AccessRemovedQA,
    "Make sure signed URL from User1 CANNOT access QA data again. FAILED."
  ).to.contain('AccessDenied');

  chai.expect(User1AccessRemainsTest,
    "Make sure signed URL from User1 CAN access test data again. FAILED."
  ).to.equal(fence.props.googleBucketInfo.test.fileContents);

  // CLEANUP
  console.log('Finally: Ensure cleanup as successful');

  chai.expect(deleteCreds0Res,
    'Cleanup of temporary Google creds for User 0 FAILED.'
  ).to.have.property('statusCode', 204);
  chai.expect(deleteCreds1Res,
    'Cleanup of temporary Google creds for User 1 FAILED.'
  ).to.have.property('statusCode', 204);
  chai.expect(deleteCreds2Res,
    'Cleanup of temporary Google creds for User 2 FAILED.'
  ).to.have.property('statusCode', 204);

  chai.expect(deleteServiceAccount0Res,
    'Cleanup of Google service account for User 0 FAILED.'
  ).to.be.empty;
  chai.expect(deleteServiceAccount1Res,
    'Cleanup of Google service account for User 1 FAILED.'
  ).to.be.empty;
  chai.expect(deleteServiceAccount2Res,
    'Cleanup of Google service account for User 2 FAILED.'
  ).to.be.empty;
}).retry(2);
