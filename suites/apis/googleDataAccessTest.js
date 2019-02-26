Feature('GoogleDataAccess');
/*
Test a full flow for a user accessing data on Google. Also test that when permissions
change on the User Access file, the user's access to data on Google changes correctly.

- Sync a User Access File
- Generate temporary Google credentials
- Use credentials to read file(s)
  - make sure we get 403's for files users should NOT have access to and we can receive
    the files that they should

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
const { Commons } = require('../../utils/commons.js');
const chai = require('chai');
const { Bash } = require('../../utils/bash.js');

const bash = new Bash();

const fs = require('fs');

BeforeSuite(async (fence, users) => {
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
});

After(async (fence, users) => {
  // Cleanup after each scenario
  const unlinkResults = Object.values(users).map(user => fence.do.unlinkGoogleAcct(user));
  await Promise.all(unlinkResults);
});

AfterSuite(async (fence, users) => {
  console.log(`Running usersync job`);
  bash.runJob('usersync');
});

Scenario('test google data access via usersync: usersync, Google link, generate temp creds, bucket access, usersync access file 2, bucket access, delete temp creds @reqGoogle @googleDataAccess',
  async (fence, users, google) => {
  console.log('make sure users google accounts are unlinked');
  await fence.complete.forceUnlinkGoogleAcct(users.user0);
  await fence.complete.forceUnlinkGoogleAcct(users.user1);
  await fence.complete.forceUnlinkGoogleAcct(users.user2);

  console.log('linking users google accounts');
  await fence.complete.linkGoogleAcctMocked(users.user0);
  await fence.complete.linkGoogleAcctMocked(users.user1);
  await fence.complete.linkGoogleAcctMocked(users.user2);

  console.log(`creating temporary google creds for users with usernames:  ${users.user0.username}, ${users.user1.username}, ${users.user2.username}`);
  console.log('NOTE: If the following fails and you do not know why, it *might* be that we have hit our limit for SA keys on given Service Account in Google.');
  // call our endpoint to get temporary creds
  // NOTE: If this fails and you don't know why, it *might* be that we've hit our limit
  //       for SA keys on this user's Google Service Account. They *should* be cleaned
  //       up after every test but if they aren't, you need to delete the keys from the
  //       fence database (in table google_service_account_keys) AND delete them from
  //       the Google Cloud Platform. Check usersUtil.js for information about these users
  //       (specifically their username is their Google Account email, you can use that
  //        to find their service account in the GCP)
  // TODO: logic that runs before suite to delete these creds
  const tempCreds0Res = await fence.complete.createTempGoogleCreds(
    users.user0.accessTokenHeader);
  const tempCreds1Res = await fence.complete.createTempGoogleCreds(
    users.user1.accessTokenHeader);
  const tempCreds2Res = await fence.complete.createTempGoogleCreds(
    users.user2.accessTokenHeader);

  console.log('saving temporary google creds to file');
  const creds0Key = tempCreds0Res.body.private_key_id;
  const creds1Key = tempCreds1Res.body.private_key_id;
  const creds2Key = tempCreds2Res.body.private_key_id;
  const pathToCreds0KeyFile = creds0Key + '.json';
  const pathToCreds1KeyFile = creds1Key + '.json';
  const pathToCreds2KeyFile = creds2Key + '.json';

  fs.writeFile(pathToCreds0KeyFile, JSON.stringify(tempCreds0Res.body), function(err) {
    if (err) {
      return console.log(err);
    }
    console.log(`Google creds file ${pathToCreds0KeyFile} saved!`);
  });

  fs.writeFile(pathToCreds1KeyFile, JSON.stringify(tempCreds1Res.body), function(err) {
    if (err) {
      return console.log(err);
    }
    console.log(`Google creds file ${pathToCreds1KeyFile} saved!`);
  });

  fs.writeFile(pathToCreds2KeyFile, JSON.stringify(tempCreds2Res.body), function(err) {
    if (err) {
      return console.log(err);
    }
    console.log(`Google creds file ${pathToCreds2KeyFile} saved!`);
  });

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

  console.log('deleting temporary google credentials');
  // call our endpoint to delete temporary creds
  const deleteCreds0Res = await fence.complete.deleteTempGoogleCreds(
    creds0Key, users.user0.accessTokenHeader);
  const deleteCreds1Res = await fence.complete.deleteTempGoogleCreds(
    creds1Key, users.user1.accessTokenHeader);
  const deleteCreds2Res = await fence.complete.deleteTempGoogleCreds(
    creds2Key, users.user2.accessTokenHeader);

  console.log('test cleanup: deleting google service accounts from google');
  const deleteServiceAccount0Res = await google.deleteServiceAccount(
    tempCreds0Res.body.project_id, tempCreds0Res.body.client_email);
  const deleteServiceAccount1Res = await google.deleteServiceAccount(
    tempCreds1Res.body.project_id, tempCreds1Res.body.client_email);
  const deleteServiceAccount2Res = await google.deleteServiceAccount(
    tempCreds2Res.body.project_id, tempCreds2Res.body.client_email);

  console.log('deleting temporary google credentials file');
  fs.unlink(pathToCreds0KeyFile, function(err) {
    if (err) throw err;
    console.log(`${pathToCreds0KeyFile} deleted!`);
  });
  fs.unlink(pathToCreds1KeyFile, function(err) {
    if (err) throw err;
    console.log(`${pathToCreds1KeyFile} deleted!`);
  });
  fs.unlink(pathToCreds2KeyFile, function(err) {
    if (err) throw err;
    console.log(`${pathToCreds2KeyFile} deleted!`);
  });

  console.log('Make assertions for user access for first run');
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

  console.log('Make assertions for user access for second run (after new usersync)');
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
});