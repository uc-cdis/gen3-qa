const { Bash } = require('../../utils/bash.js');
const bash = new Bash();
const { Commons } = require('../../utils/commons.js');
// const { getAccessToken } = require('../../test_setup.js');
// const { User } = require('../../utils/user.js');


Feature('GoogleServiceAccountRemoval');

/**
 * Test that the SA removal job, fence-create google-manage-user-registrations,
 * deletes what it is supposed to delete
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


Scenario('SA removal job test: user does not exist in fence @reqGoogle', async (fence, users) => {
  // test invalid project because the user does not exist in fence

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

  await fence.do.unlinkGoogleAcct(
    users.user0,
  );

  // run clean up job
  let jobRes = checkAndCleanSA();

  // clean up
  console.log('cleaning up');

  await fence.do.deleteGoogleServiceAccount(
    users.user0,
    googleProject.serviceAccountEmail,
  );

  // asserts

  fence.ask.detected_invalid_google_project(jobRes);
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

  // run clean up job
  let jobRes = checkAndCleanSA();

  // clean up
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

  // asserts

  fence.ask.detected_invalid_google_project(jobRes);
});


Scenario('SA removal job test: SA has external access @reqGoogle', async (fence, users, google) => {
  // test invalid SA because it has keys set up

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

  const tempCreds0Res = await google.createServiceAccountKey(googleProject.id, googleProject.serviceAccountEmail);
  keyFullName = tempCreds0Res.name;
  console.log(keyFullName);

  // run clean up job
  let jobRes = checkAndCleanSA();

  // clean up
  console.log('cleaning up');

  console.log('deleting SA key');
  await google.deleteServiceAccountKey(keyFullName);

  await fence.do.unlinkGoogleAcct(
    users.user0,
  );

  await fence.do.deleteGoogleServiceAccount(
    users.user0,
    googleProject.serviceAccountEmail,
  );

  // asserts

  fence.ask.detected_invalid_google_project(jobRes);
});
