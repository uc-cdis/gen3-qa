const atob = require('atob');
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
 * testing other removal use cases.
 *
 * Workaround: the "compute" SAs (automatically created in Google) are not
 * checked for external access during the validation, so we use one to create
 * a key.
 */


/**
 * Cleans up fence's DBs for links and service accounts
 * Takes the google, fence, and users services/utils as params
 * @returns {Promise<void>}
 */
async function suiteCleanup(google, fence, users) {
  // google projects to 'clean up'
  const googleProjects = [
    fence.props.googleProjectA,
    fence.props.googleProjectWithComputeServiceAcct,
  ];
  // remove unimportant roles from google projects
  for (const proj of googleProjects) {
    await google.removeAllOptionalUsers(proj.id);
  }

  // delete all service accounts from fence
  for (const proj of googleProjects) {
    // TRY to delete the service account
    // NOTE: the service account might have been registered unsuccessfully or deleted,
    //  we are just hitting the endpoints as if it still exists and ignoring errors
    const projUser = users.mainAcct;

    if (!projUser.linkedGoogleAccount) {
      // If the project user is not linked, link to project owner then delete
      await fence.do.forceLinkGoogleAcct(projUser, proj.owner)
        .then(() =>
          fence.do.deleteGoogleServiceAccount(projUser, proj.serviceAccountEmail),
        );
    } else if (projUser.linkedGoogleAccount !== proj.owner) {
      // If the project user is linked, but not to project owner,
      // unlink user, then link to project owner and delete service account
      await fence.complete.unlinkGoogleAcct(projUser)
        .then(() =>
          fence.do.forceLinkGoogleAcct(projUser, proj.owner),
        )
        .then(() =>
          fence.do.deleteGoogleServiceAccount(projUser, proj.serviceAccountEmail),
        );
    } else {
      // If project user is linked to the project owner, delete the service account
      await fence.do.deleteGoogleServiceAccount(projUser, proj.serviceAccountEmail);
    }
  }

  // unlink all google accounts
  const unlinkPromises = Object.values(users).map(user => fence.do.unlinkGoogleAcct(user));
  await Promise.all(unlinkPromises);
}


BeforeSuite(async (google, fence, users) => {
  await suiteCleanup(google, fence, users);

  // TODO: do this at the beginning of the tests

  console.log('Ensure test buckets are linked to projects in this commons...');

  var bucketId = fence.props.googleBucketInfo.QA.bucketId
  var googleProjectId = fence.props.googleBucketInfo.QA.googleProjectId
  var projectAuthId = 'QA'
  var fenceCmd = `fence-create google-bucket-create --unique-name ${bucketId} --google-project-id ${googleProjectId} --project-auth-id ${projectAuthId} --public False`;
  console.log(`Running: ${fenceCmd}`)
  var response = bash.runCommand(fenceCmd, 'fence');

  console.log('Clean up Google Bucket Access Groups from previous runs...');
  bash.runJob('google-verify-bucket-access-group');
});


After(async (google, fence, users) => {
  await suiteCleanup(google, fence, users);
});


function checkAndCleanSA() {
  var fenceCmd = 'fence-create --verbose google-manage-user-registrations';
  console.log(`Running: ${fenceCmd}`);
  var jobRes = bash.runCommand(fenceCmd, 'fence');
  console.log(jobRes);
  return jobRes;
}


Scenario('SA removal job test: monitor SA does not have access @reqGoogle', async (fence, users, google) => {
  // test invalid SA because the monitor does not have access

  // Setup
  let getMonitorRes = await fence.do.getGoogleServiceAccountMonitor(users.user0);
  fence.ask.assertStatusCode(getMonitorRes, 200, 'Could not get SA monitor info');
  let monitorEmail = getMonitorRes.body.service_account_email;

  const googleProject = fence.props.googleProjectDynamic;
  await fence.complete.forceLinkGoogleAcct(users.user0, googleProject.owner);

  // Register account
  registerRes = await fence.do.registerGoogleServiceAccount(
    users.user0,
    googleProject,
    ['QA']
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountSuccess); // TODO: sequence

  // Remove monitor's access
  console.log(`removing monitoring access from SA ${monitorEmail}`);
  const monitorRoles = [
    'roles/resourcemanager.projectIamAdmin',
    'roles/editor'
  ];
  for (var role of monitorRoles) {
    await google.removeUserRole(
      googleProject.id,
      {
        role,
        members: [`serviceAccount:${monitorEmail}`]
      }
    );
  }

  // the role update can take a bit of time to propagate
  const isInvalidProjectDetected = async function() {
    try {
      let jobRes = checkAndCleanSA(); // run clean up job
      fence.ask.detected_invalid_google_project(jobRes); // check results
      return true;
    }
    catch {
      // assert failed: no problem detected by the clean up job yet
      return false;
    }
  };
  const startWait = 10; // start by waiting 10 secs
  const timeout = 120; // max number of seconds to wait
  detected_invalid_google_project = true;
  try {
    await apiUtil.smartWait(isInvalidProjectDetected, [], timeout, '', startWait);
  }
  catch {
    detected_invalid_google_project = false;
  }

  // Clean up
  console.log('cleaning up');

  // Add monitor's access back
  for (var role of monitorRoles) {
    await google.updateUserRole(
      googleProject.id,
      {
        role,
        members: [`serviceAccount:${monitorEmail}`]
      }
    );
  }

  await fence.do.deleteGoogleServiceAccount(
    users.user0,
    googleProject.serviceAccountEmail,
  );

  await fence.do.unlinkGoogleAcct(
    users.user0,
  );

  // Asserts
  chai.expect(detected_invalid_google_project,
    '"google-manage-user-registrations" should have detected an invalid Google project'
  ).to.be.true;
});


Scenario('SA removal job test: user does not exist in fence @reqGoogle', async (fence, users, google, files) => {
  // test invalid project because the user does not exist in fence

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

  // Get creds to access data
  // TODO: function that returns pathToCreds0KeyFile + function that deletes it
  const tempCreds0Res = await google.createServiceAccountKey(googleProject.id, googleProject.serviceAccountEmail);
  keyFullName = tempCreds0Res.name;
  console.log(keyFullName);
  var keyData = JSON.parse(atob(tempCreds0Res.privateKeyData));

  const pathToCreds0KeyFile = keyData.private_key_id + '.json';
  await files.createTmpFile(pathToCreds0KeyFile, JSON.stringify(keyData));
  console.log(`Google creds file ${pathToCreds0KeyFile} saved!`);

  // Access data
  user0AccessQARes = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToCreds0KeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName
  );

  // Make the project invalid
  await fence.do.unlinkGoogleAcct(
    users.user0,
  );

  // Run clean up job
  let jobRes = checkAndCleanSA();

  // Try to access data
  user0AccessQAResExpired = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToCreds0KeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName
  );

  // Clean up
  console.log('cleaning up');

  console.log('deleting SA key');
  await google.deleteServiceAccountKey(keyFullName);

  console.log('deleting temporary google credentials file');
  files.deleteFile(pathToCreds0KeyFile);

  await fence.do.deleteGoogleServiceAccount(
    users.user0,
    googleProject.serviceAccountEmail,
  );

  // Asserts
  chai.expect(user0AccessQARes,
    'User should have bucket access before clean up job'
  ).to.have.property('id');
  fence.ask.detected_invalid_google_project(jobRes);
  chai.expect(user0AccessQAResExpired,
    'User should NOT have bucket access after clean up job'
  ).to.have.property('statusCode', 403);
});


Scenario('SA removal job test: user does not have access to data @reqGoogle', async (fence, users) => {
  // test invalid project because the user does not have access to the data

  // Setup
  const googleProject = fence.props.googleProjectA;
  await fence.complete.forceLinkGoogleAcct(users.user0, googleProject.owner);

  // Register account
  let registerRes = await fence.do.registerGoogleServiceAccount(
    users.user0,
    googleProject,
    ['QA']
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountSuccess);

  console.log(`Running useryaml job with ${Commons.userAccessFiles.newUserAccessFile2}`);
  Commons.setUserYaml(Commons.userAccessFiles.newUserAccessFile2);
  bash.runJob('useryaml-job');
  // now user0 does not have access to project QA anymore

  // Run clean up job
  let jobRes = checkAndCleanSA();

  // Clean up
  console.log('cleaning up');

  await fence.do.deleteGoogleServiceAccount(
    users.user0,
    googleProject.serviceAccountEmail,
  );

  await fence.do.unlinkGoogleAcct(
    users.user0,
  );

  console.log(`Running usersync job`);
  bash.runJob('usersync');

  // Asserts
  fence.ask.detected_invalid_google_project(jobRes);
});


Scenario('SA removal job test: SA has external access @reqGoogle', async (fence, users, google) => {
  // test invalid project because the SA has an external key set up

  // Setup
  const googleProject = fence.props.googleProjectA; // TODO: googleProjectDynamic
  await fence.complete.forceLinkGoogleAcct(users.user0, googleProject.owner);

  // Register account
  let registerRes = await fence.do.registerGoogleServiceAccount(
    users.user0,
    googleProject,
    ['QA']
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountSuccess);

  const tempCreds0Res = await google.createServiceAccountKey(googleProject.id, googleProject.serviceAccountEmail);
  keyFullName = tempCreds0Res.name;
  console.log(keyFullName);

  // Run clean up job
  let jobRes = checkAndCleanSA();

  // Clean up
  console.log('cleaning up');

  await google.deleteServiceAccountKey(keyFullName);

  await fence.do.unlinkGoogleAcct(
    users.user0,
  );

  await fence.do.deleteGoogleServiceAccount(
    users.user0,
    googleProject.serviceAccountEmail,
  );

  // Asserts
  fence.ask.detected_invalid_google_project(jobRes);
});
