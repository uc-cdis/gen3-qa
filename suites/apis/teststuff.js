const chai = require('chai');

const apiUtil = require('../../utils/apiUtil.js');
const { Bash } = require('../../utils/bash.js');
const bash = new Bash();
const { Commons } = require('../../utils/commons.js');


Feature('GoogleServiceAccountRemoval');

/**
 * Test that the SA removal job, fence-create google-manage-user-registrations,
 * deletes invalid SA and Google projects.
 *
 * To check that the user does not have access to the data anymore after the
 * job cleans up a SA, we need to create a key before the clean up, and make
 * sure we cannot use it after the clean up. Since the validation checks that
 * there is no external access to the SA, creating a key would prevent us from
 * testing other removal use cases. This is why the data access is only
 * checked in the "SA has external access" test.
 */


BeforeSuite(async (google, fence, users) => {
  await fence.complete.suiteCleanup(google, users);
});


After(async (google, fence, users) => {
  await fence.complete.suiteCleanup(google, users);
});


function checkAndCleanSA() {
  var fenceCmd = 'fence-create --verbose google-manage-user-registrations';
  console.log(`Running: ${fenceCmd}`);
  var jobRes = bash.runCommand(fenceCmd, 'fence');
  console.log(jobRes);
  return jobRes;
}


Scenario('1SA removal job test: SA has external access @reqGoogle', async (fence, users, google, files) => {
  // test invalid project because the SA has an external key set up

  // Setup
  const googleProject = fence.props.googleProjectDynamic;
  await fence.complete.forceLinkGoogleAcct(users.user0, googleProject.owner);

  // Register account
  let registerRes = await fence.do.registerGoogleServiceAccount(
    users.user0,
    googleProject,
    ['QA']
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountSuccess);

  // Lock the project
  lockRes = await google.lockGoogleProject(googleProject);
  chai.expect(lockRes, 'Could not lock project').to.be.true;

  // Get creds to access data: this makes the project invalid
  let [pathToKeyFile, keyFullName] = await google.createServiceAccountKeyFile(googleProject);

  // Access data
  user0AccessQARes = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToKeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName
  );

  // Run clean up job
  let jobRes = checkAndCleanSA();

  // await apiUtil.sleepMS(30 * 1000);

  // Try to access data
  user0AccessQAResAfter = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToKeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName
  );

  // Clean up
  console.log('cleaning up');

  await google.deleteServiceAccountKey(keyFullName);
  files.deleteFile(pathToKeyFile);

  await fence.do.deleteGoogleServiceAccount(
    users.user0,
    googleProject.serviceAccountEmail,
  );

  await fence.do.unlinkGoogleAcct(
    users.user0,
  );

  // Unlock the project
  let unlockRes = await google.unlockGoogleProject(googleProject);

  // Asserts
  chai.expect(unlockRes, 'Could not unlock project').to.be.true;

  chai.expect(user0AccessQARes,
    'User should have bucket access before clean up job'
  ).to.have.property('id');

  fence.ask.detected_invalid_google_project(jobRes, fence.props.monitorSAJobLog.externalAccess);

  chai.expect(user0AccessQAResAfter,
    'User should NOT have bucket access after clean up job'
  ).to.have.property('statusCode', 403);
});//.retry(2);


Scenario('2SA removal job test: SA has external access @reqGoogle', async (fence, users, google, files) => {
  // test invalid project because the SA has an external key set up

  // Lock the project
  const googleProject = fence.props.googleProjectDynamic;
  lockRes = await google.lockGoogleProject(googleProject);
  chai.expect(lockRes, 'Could not lock project').to.be.true;

  // Setup
  await fence.complete.forceLinkGoogleAcct(users.user0, googleProject.owner);

  // Register account
  let registerRes = await fence.do.registerGoogleServiceAccount(
    users.user0,
    googleProject,
    ['QA']
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountSuccess);

  // Get creds to access data: this makes the project invalid
  let [pathToKeyFile, keyFullName] = await google.createServiceAccountKeyFile(googleProject);

  // Access data
  user0AccessQARes = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToKeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName
  );

  // Run clean up job
  let jobRes = checkAndCleanSA();

  // Try to access data
  user0AccessQAResAfter = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToKeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName
  );

  // Clean up
  console.log('cleaning up');

  await google.deleteServiceAccountKey(keyFullName);
  files.deleteFile(pathToKeyFile);

  await fence.do.deleteGoogleServiceAccount(
    users.user0,
    googleProject.serviceAccountEmail,
  );

  await fence.do.unlinkGoogleAcct(
    users.user0,
  );

  // Unlock the project
  let unlockRes = await google.unlockGoogleProject(googleProject);

  // Asserts
  chai.expect(user0AccessQARes,
    'User should have bucket access before clean up job'
  ).to.have.property('id');

  fence.ask.detected_invalid_google_project(jobRes, fence.props.monitorSAJobLog.externalAccess);

  chai.expect(user0AccessQAResAfter,
    'User should NOT have bucket access after clean up job'
  ).to.have.property('statusCode', 403);

  chai.expect(unlockRes, 'Could not unlock project').to.be.true;
});//.retry(2);


Scenario('3SA removal job test: SA has external access @reqGoogle', async (fence, users, google, files) => {
  // test invalid project because the SA has an external key set up

  // Lock the project
  const googleProject = fence.props.googleProjectDynamic;
  lockRes = await google.lockGoogleProject(googleProject);
  chai.expect(lockRes, 'Could not lock project').to.be.true;

  // Setup
  await fence.complete.forceLinkGoogleAcct(users.user0, googleProject.owner);

  // Register account
  let registerRes = await fence.do.registerGoogleServiceAccount(
    users.user0,
    googleProject,
    ['QA']
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountSuccess);

  // Get creds to access data: this makes the project invalid
  let [pathToKeyFile, keyFullName] = await google.createServiceAccountKeyFile(googleProject);

  // Access data
  user0AccessQARes = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToKeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName
  );

  // Run clean up job
  let jobRes = checkAndCleanSA();

  // Try to access data
  user0AccessQAResAfter = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToKeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName
  );

  // Clean up
  console.log('cleaning up');

  await google.deleteServiceAccountKey(keyFullName);
  files.deleteFile(pathToKeyFile);

  await fence.do.deleteGoogleServiceAccount(
    users.user0,
    googleProject.serviceAccountEmail,
  );

  await fence.do.unlinkGoogleAcct(
    users.user0,
  );

  // Unlock the project
  let unlockRes = await google.unlockGoogleProject(googleProject);

  // Asserts
  chai.expect(user0AccessQARes,
    'User should have bucket access before clean up job'
  ).to.have.property('id');

  fence.ask.detected_invalid_google_project(jobRes, fence.props.monitorSAJobLog.externalAccess);

  chai.expect(user0AccessQAResAfter,
    'User should NOT have bucket access after clean up job'
  ).to.have.property('statusCode', 403);

  chai.expect(unlockRes, 'Could not unlock project').to.be.true;
});//.retry(2);


Scenario('4SA removal job test: SA has external access @reqGoogle', async (fence, users, google, files) => {
  // test invalid project because the SA has an external key set up

  // Lock the project
  const googleProject = fence.props.googleProjectDynamic;
  lockRes = await google.lockGoogleProject(googleProject);
  chai.expect(lockRes, 'Could not lock project').to.be.true;

  // Setup
  await fence.complete.forceLinkGoogleAcct(users.user0, googleProject.owner);

  // Register account
  let registerRes = await fence.do.registerGoogleServiceAccount(
    users.user0,
    googleProject,
    ['QA']
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountSuccess);

  // Get creds to access data: this makes the project invalid
  let [pathToKeyFile, keyFullName] = await google.createServiceAccountKeyFile(googleProject);

  // Access data
  user0AccessQARes = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToKeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName
  );

  // Run clean up job
  let jobRes = checkAndCleanSA();

  // Try to access data
  user0AccessQAResAfter = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToKeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName
  );

  // Clean up
  console.log('cleaning up');

  await google.deleteServiceAccountKey(keyFullName);
  files.deleteFile(pathToKeyFile);

  await fence.do.deleteGoogleServiceAccount(
    users.user0,
    googleProject.serviceAccountEmail,
  );

  await fence.do.unlinkGoogleAcct(
    users.user0,
  );

  // Unlock the project
  let unlockRes = await google.unlockGoogleProject(googleProject);

  // Asserts
  chai.expect(user0AccessQARes,
    'User should have bucket access before clean up job'
  ).to.have.property('id');

  fence.ask.detected_invalid_google_project(jobRes, fence.props.monitorSAJobLog.externalAccess);

  chai.expect(user0AccessQAResAfter,
    'User should NOT have bucket access after clean up job'
  ).to.have.property('statusCode', 403);

  chai.expect(unlockRes, 'Could not unlock project').to.be.true;
});//.retry(2);