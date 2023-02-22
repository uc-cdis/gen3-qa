const { expect } = require('chai');
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

// IAM access needed by the monitor service account
const monitorRoles = [
  'roles/resourcemanager.projectIamAdmin',
  'roles/editor',
];

BeforeSuite(async ({ google, fence, users }) => {
  await fence.complete.suiteCleanup(google, users);
});

After(async ({ google, fence, users }) => {
  try {
    await fence.complete.suiteCleanup(google, users);
  } catch (error) {
    console.log(error);
  }
});

AfterSuite(async ({ google, fence }) => {
  // make sure the monitor SA has access
  const googleProject = fence.props.googleProjectDynamic;
  for (const role of monitorRoles) {
    const res = await google.updateUserRole(
      googleProject.id,
      {
        role,
        members: [`serviceAccount:${fence.props.monitorServiceAccount}`],
      },
    );
    expect(
      res,
      `Failed to update monitor SA roles in Google project ${googleProject.id} (owner ${googleProject.owner}). Next tests may fail.\n`,
    ).to.not.have.property('code');
  }
});

function runVerifyUserSAsJob() {
  const fenceCmd = 'fence-create google-manage-user-registrations';
  console.log(`Running: ${fenceCmd}`);
  const jobRes = bash.runCommand(fenceCmd, 'fence');
  console.log(jobRes);
  return jobRes;
}

Scenario('SA removal job test: no access removal when SA is valid @reqGoogle', async ({
  I, fence, users, google, files,
}) => {
  // test that the clean up job does not remove access to valid SA/projects
  // the user logs in
  // login with the user0
  await login.complete.login(users.user0);
  // browser UI request for redirect
  I.amOnPage(fenceProps.endpoints.linkGoogle);
  // Setup
  const googleProject = fence.props.googleProjectDynamic;
  await fence.complete.forceLinkGoogleAcct(users.user0, googleProject.owner);

  // Register account
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.user0,
    googleProject,
    ['QA'],
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountSuccess);

  // Get creds to access data
  let [pathToKeyFile, keyFullName] = await google.createServiceAccountKeyFile(googleProject);

  // Access data
  const user0AccessQARes = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToKeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName,
  );

  // Delete the creds so that the clean up job will not mark this SA as invalid
  await google.deleteServiceAccountKey(keyFullName);
  files.deleteFile(pathToKeyFile);

  // Run clean up job
  runVerifyUserSAsJob();

  // Get creds to access data
  [pathToKeyFile, keyFullName] = await google.createServiceAccountKeyFile(googleProject);

  // Access data
  const user0AccessQAResAfter = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToKeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName,
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

  // Asserts
  expect(user0AccessQARes,
    'User should have bucket access before clean up job').to.have.property('id');

  expect(user0AccessQAResAfter,
    'User should have bucket access after clean up job').to.have.property('id');
}).retry(5);

Scenario('SA removal job test: user does not exist in fence @reqGoogle', async ({
  fence, users, google, files,
}) => {
  // test invalid project because the user does not exist in fence

  // Setup
  const googleProject = fence.props.googleProjectDynamic;
  await fence.complete.forceLinkGoogleAcct(users.user0, googleProject.owner);

  // Register account
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.user0,
    googleProject,
    ['QA'],
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountSuccess);

  // Make the project invalid
  await fence.do.unlinkGoogleAcct(
    users.user0,
  );

  // Run clean up job
  const jobRes = runVerifyUserSAsJob();

  // Try to access data
  const [pathToKeyFile, keyFullName] = await google.createServiceAccountKeyFile(googleProject);
  const user0CannotAccessQAAfter = await google.waitForNoDataAccess(
    fence.props.googleBucketInfo.QA,
    pathToKeyFile,
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

  // Asserts
  fence.ask.detected_invalid_google_project(jobRes, fence.props.monitorSAJobLog.noFenceUser);

  expect(
    user0CannotAccessQAAfter,
    'User should NOT have bucket access after clean up job',
  ).to.be.true;
}).retry(5);

Scenario('SA removal job test: user does not have access to data @reqGoogle', async ({
  fence, users, google, files,
}) => {
  // test invalid project because the user does not have access to the data

  // Setup
  const googleProject = fence.props.googleProjectDynamic;
  await fence.complete.forceLinkGoogleAcct(users.user0, googleProject.owner);

  // Register account
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.user0,
    googleProject,
    ['QA'],
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountSuccess);

  // Make the project invalid
  console.log(`Running useryaml job with ${Commons.userAccessFiles.newUserAccessFile2}`);
  Commons.setUserYaml(Commons.userAccessFiles.newUserAccessFile2);
  bash.runJob('useryaml-job');
  // now user0 does not have access to project QA anymore

  // Run clean up job
  const jobRes = runVerifyUserSAsJob();

  // Try to access data
  const [pathToKeyFile, keyFullName] = await google.createServiceAccountKeyFile(googleProject);
  const user0CannotAccessQAAfter = await google.waitForNoDataAccess(
    fence.props.googleBucketInfo.QA,
    pathToKeyFile,
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

  console.log('Running usersync job');
  bash.runJob('usersync', 'FORCE true');

  // Asserts
  fence.ask.detected_invalid_google_project(jobRes, fence.props.monitorSAJobLog.noDataAccess);

  expect(user0CannotAccessQAAfter,
    'User should NOT have bucket access after clean up job').to.be.true;
}).retry(5);

Scenario('SA removal job test: SA has external access @reqGoogle', async ({
  fence, users, google, files,
}) => {
  // test invalid project because the SA has an external key set up

  // Setup
  const googleProject = fence.props.googleProjectDynamic;
  await fence.complete.forceLinkGoogleAcct(users.user0, googleProject.owner);

  // Register account
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.user0,
    googleProject,
    ['QA'],
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountSuccess);

  // Get creds to access data: this makes the project invalid
  const [pathToKeyFile, keyFullName] = await google.createServiceAccountKeyFile(googleProject);

  // Access data
  const user0AccessQARes = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToKeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName,
  );

  // Run clean up job
  const jobRes = runVerifyUserSAsJob();

  // Make sure we cannot access data after the clean up
  const user0CannotAccessQAAfter = await google.waitForNoDataAccess(
    fence.props.googleBucketInfo.QA,
    pathToKeyFile,
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

  // Asserts
  expect(user0AccessQARes,
    'User should have bucket access before clean up job').to.have.property('id');

  fence.ask.detected_invalid_service_account(jobRes, fence.props.monitorSAJobLog.externalAccess);

  expect(user0CannotAccessQAAfter,
    'User should NOT have bucket access after clean up job').to.be.true;
}).retry(5);

// We run this test last because if the roles update at the end fails,
// the following tests would fail.
Scenario('SA removal job test: monitor SA does not have access @reqGoogle', async ({
  fence, users, google, files,
}) => {
  // test invalid SA because the monitor does not have access

  // Setup
  const googleProject = fence.props.googleProjectDynamic;
  await fence.complete.forceLinkGoogleAcct(users.user0, googleProject.owner);

  // Register account
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.user0,
    googleProject,
    ['QA'],
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountSuccess);

  // Remove monitor's access
  console.log(`removing monitoring access from SA ${fence.props.monitorServiceAccount}`);
  for (const role of monitorRoles) {
    await google.removeUserRole(
      googleProject.id,
      {
        role,
        members: [`serviceAccount:${fence.props.monitorServiceAccount}`],
      },
    );
  }

  // the role update can take a bit of time to propagate
  /**
   * return true if the job detected an invalid project, false otherwise
   */
  const isInvalidProjectDetected = async function () {
    try {
      const jobRes = runVerifyUserSAsJob(); // run clean up job
      fence.ask.detected_invalid_google_project(jobRes); // check results
      // here we do not check the reason the project is invalid, because the
      // error message varies depending on when the access was revoked (before
      // the job started or while it was running)
      return true;
    } catch {
      // assert failed: no problem detected by the clean up job yet
      console.log('No invalid project detected by the job yet: rerunning');
      return false;
    }
  };
  const startWait = 10; // start by waiting 10 secs
  const timeout = 120; // max number of seconds to wait
  let detectedInvalidGoogleProject = true;
  try {
    await apiUtil.smartWait(isInvalidProjectDetected, [], timeout, '', startWait);
  } catch {
    detectedInvalidGoogleProject = false;
  }

  // Try to access data
  const [pathToKeyFile, keyFullName] = await google.createServiceAccountKeyFile(googleProject);
  const user0CannotAccessQAAfter = await google.waitForNoDataAccess(
    fence.props.googleBucketInfo.QA,
    pathToKeyFile,
  );

  // Clean up
  console.log('cleaning up');

  // Add monitor's access back
  const addRolesRes = [];
  for (const role of monitorRoles) {
    addRolesRes.push(
      await google.updateUserRole(
        googleProject.id,
        {
          role,
          members: [`serviceAccount:${fence.props.monitorServiceAccount}`],
        },
      ),
    );
  }

  await google.deleteServiceAccountKey(keyFullName);
  files.deleteFile(pathToKeyFile);

  await fence.do.deleteGoogleServiceAccount(
    users.user0,
    googleProject.serviceAccountEmail,
  );

  await fence.do.unlinkGoogleAcct(
    users.user0,
  );

  // Asserts
  expect(detectedInvalidGoogleProject,
    '"google-manage-user-registrations" should have detected an invalid Google project').to.be.true;

  expect(user0CannotAccessQAAfter,
    'User should NOT have bucket access after clean up job').to.be.true;

  for (const res of addRolesRes) {
    expect(
      res,
      `Failed to update monitor SA roles in Google project ${googleProject.id} (owner ${googleProject.owner}). Next tests may fail. Will try to add them again at the end of this test suite.\n`,
    ).to.not.have.property('code');
  }
}).retry(5);
