const chai = require('chai');
const expect = chai.expect;

const apiUtil = require('../../utils/apiUtil.js');
const { Bash } = require('../../utils/bash.js');
const bash = new Bash();


Feature('RegisterGoogleServiceAccount');

/**
 * Tests fence's endpoints for registering/deleting/etc. service accounts.
 *
 * Required Manual Configuration:
 *   -Google Cloud Platform projects as well as service accounts are required to run these tests
 *     The project information should be put into fence props
 *     These creation of these projects is semi-automated by the script `setup-google-projects.sh`.
 *     Run the setup script and follow the instructions provided by the script.
 *   -It's also required that a Google group is created and the email is located in fence props
 *     Just create a google group then get the group email and put it in fence props
 */


BeforeSuite(async (google, fence, users) => {
  await google.suiteCleanup(fence, users);
});

After(async (google, fence, users) => {
  await google.suiteCleanup(fence, users);
});


Scenario('Register Google Service Account Success @reqGoogle @first', async (fence, users) => {
  // Link to a member in a valid google project and register the SA
  // Registration should succeed

  const googleProject = fence.props.googleProjectA;

  // Setup
  await fence.complete.forceLinkGoogleAcct(users.mainAcct, googleProject.owner);

  // Register account
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.mainAcct,
    googleProject,
    ['test'],
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountSuccess);

  // Delete registration
  const deleteRes = await fence.do.deleteGoogleServiceAccount(
    users.mainAcct,
    googleProject.serviceAccountEmail,
  );
  fence.ask.responsesEqual(deleteRes, fence.props.resDeleteServiceAccountSuccess);
});

Scenario('Google project locking test @reqGoogle', async (fence, google) => {
  // test the Google project locking/unlocking functions

  // Try to lock an unlockable project
  let lockRes = await google.lockGoogleProject(fence.props.googleProjectA);
  chai.expect(lockRes, 'Should not be able to lock this project').to.be.false;

  // Lock the project
  const googleProject = fence.props.googleProjectDynamic;
  lockRes = await google.lockGoogleProject(googleProject);
  chai.expect(lockRes, 'Could not lock project').to.be.true;

  // Make sure the locking SA is listed in the project's SAs
  // It sometimes takes a bit of time to appear in the list
  let saEmail = google.getLockingServiceAccountEmail(googleProject.serviceAccountEmail);
  /**
   * return true if the locking SA is in the list, false otherwise
   */
  let isLockingSaInList = async function(saEmail) {
    let listRes = await google.listServiceAccounts(googleProject.id);
    return listRes.some(sa => sa.email === saEmail);
  };
  await apiUtil.smartWait(isLockingSaInList, [saEmail], timeout=20, `Not in list after ${timeout} secs`, startWait=1);

  // Try to lock the project again
  lockRes = await google.lockGoogleProject(googleProject, timeout=5);
  chai.expect(lockRes, 'Should not be able to lock project (already locked)').to.be.false;

  // Unlock the project
  let unlockRes = await google.unlockGoogleProject(googleProject);
  chai.expect(unlockRes, 'Could not unlock project').to.be.true;

  // Make sure the locking SA is not listed anymore
  listRes = await google.listServiceAccounts(googleProject.id);
  found = listRes.some(sa => sa.email === saEmail);
  chai.expect(found, 'The locking SA should not be listed in the project\'s SAs').to.be.false;

  // Try to unlock the project again
  unlockRes = await google.unlockGoogleProject(googleProject);
  chai.expect(unlockRes, 'Unlocking an unlocked project should work').to.be.true;
});

//
// Google Project validity
//

Scenario('Register SA with a user that hasn’t linked their Google Account @reqGoogle', async (fence, users) => {
  // Without linking to member in google project, try to register the project's service account
  // Registration should fail

  // check members_exist_in_fence

  // Register account
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.mainAcct,
    fence.props.googleProjectA,
    ['test'],
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountNotLinked);
});

Scenario('Register SA with a user that has linked their Google Account @reqGoogle', async (fence, users) => {
  // Link to a google account, but an account that is not a member of the
  // google project we are trying to register.
  // Registration should fail

  // check user_has_access

  const googleProject = fence.props.googleProjectA;
  const currentUser = users.mainAcct;

  // Setup
  // Find a user's google email that's NOT in the GCP, meaning
  //   an email that is NOT the owner of the google project and NOT the current user
  // It is assumed that all users' usernames are google account emails
  const userNotInGCP = Object.values(users).find(user =>
    user.googleCreds.email !== currentUser.username &&
    user.googleCreds.email !== googleProject.owner,
  );
  // Link user to an email NOT in the GCP
  await fence.complete.forceLinkGoogleAcct(currentUser, userNotInGCP.username);

  // Register account
  const registerRes = await fence.do.registerGoogleServiceAccount(
    currentUser,
    googleProject,
    ['test'],
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountNotLinked);
});

Scenario('Register SA from Google Project that has a parent org @reqGoogle', async (fence, users) => {
  // Try to register a service account in Google project that has a parent organization.
  // Registration should fail

  // check valid_parent_org

  const googleProject = fence.props.googleProjectWithParentOrg;

  // Setup
  await fence.complete.forceLinkGoogleAcct(
    users.mainAcct,
    googleProject.owner,
  );

  // Register account
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.mainAcct,
    googleProject,
    ['test'],
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountHasParentOrg);
}).retry(2);



Scenario('Register SA from Google Project that doesn’t have fence’s monitoring SA @reqGoogle', async (fence, users) => {
  // Try to register a google project that doesn't have fence's service account in it
  // Registration should fail

  // check monitor_has_access

  const googleProject = fence.props.googleProjectFenceNotRegistered;

  // Setup
  await fence.complete.forceLinkGoogleAcct(
    users.mainAcct,
    googleProject.owner,
  );

  // Register account
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.mainAcct,
    googleProject,
    ['test'],
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountFenceNoAccess);
});

Scenario('Register SA from Google Project with invalid members @reqGoogle', async (fence, users, google) => {
  // Register a google project service account that has a member that's an invalid type
  // Registration should fail

  // check valid_member_types

  const googleProject = fence.props.googleProjectA;

  // Setup
  await fence.complete.forceLinkGoogleAcct(
    users.mainAcct,
    googleProject.owner,
  );
  const bindingWithGroup = {
    role: 'roles/viewer',
    members: [`group:${fence.props.googleGroupTestEmail}`],
  };
  await google.updateUserRole(googleProject.id, bindingWithGroup);

  // Register account
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.mainAcct,
    googleProject,
    ['test'],
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountInvalidMemberType);
});

//
// Service Account validity
//

Scenario('Register SA in a Google Project that is NOT from that Project @reqGoogle', async (fence, users) => {
  // Try to register a service account from one google project for a DIFFERENT google project
  // Registration should fail

  // check owned_by_project

  const projectA = fence.props.googleProjectA;
  const projectB = fence.props.googleProjectWithComputeServiceAcct;

  // Setup
  await fence.complete.forceLinkGoogleAcct(
    users.mainAcct,
    projectA.owner,
  );

  // Register account with mismatched service account email and project ID
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.mainAcct,
    {
      serviceAccountEmail: projectB.serviceAccountEmail,
      id: projectA.id,
    },
    ['test'],
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountWrongProject);
});


Scenario('Register SA that looks like its from the Google Project but doesnt actually exist @reqGoogle', async (fence, users) => {
  // Try to register a service account with an email that looks like it's from the project
  // but the SA doesn't actually exist
  // Registration should fail

  // check policy_accessible

  const projectA = fence.props.googleProjectA;

  // Setup
  await fence.complete.forceLinkGoogleAcct(
    users.mainAcct,
    projectA.owner,
  );

  // Register account with mismatched service account email and project ID
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.mainAcct,
    {
      serviceAccountEmail: 'thisdoesntexist123@' + projectA.serviceAccountEmail.split('@')[1],
      id: projectA.id,
    },
    ['test'],
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountInaccessibleServiceAcct);
}).retry(2);


Scenario('Register allowed Google-Managed SA @reqGoogle', async (fence, users) => {
  // Register google's compute service account from a google project with the compute API
  // Registration should succeed

  // check valid_type true

  const googleProject = fence.props.googleProjectWithComputeServiceAcct;

  // Setup
  await fence.complete.forceLinkGoogleAcct(
    users.mainAcct,
    googleProject.owner,
  );

  // Register account with an invalid type service account
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.mainAcct,
    googleProject,
    ['test'],
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountSuccess);
});

Scenario('Register SA of invalid type @reqGoogle', async (fence, users) => {
  // Register a google managed service account that is not allowed
  // Registration should fail

  // check valid_type false

  const googleProject = fence.props.googleProjectWithInvalidServiceAcct;

  // Setup
  await fence.complete.forceLinkGoogleAcct(
    users.mainAcct,
    googleProject.owner,
  );

  // Register account with an invalid type service account
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.mainAcct,
    googleProject,
    ['test'],
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountInvalidServiceAcct);
});

Scenario('Register SA that has a key generated @reqGoogle', async (fence, users) => {
  // Register a service account that has a key generated
  // Registration should fail

  // check no_external_access

  const googleProject = fence.props.googleProjectServiceAcctHasKey;

  // Setup
  await fence.complete.forceLinkGoogleAcct(
    users.mainAcct,
    googleProject.owner,
  );

  // Register account with an invalid type service account
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.mainAcct,
    googleProject,
    ['test'],
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountInvalidServiceAcct);
});


//
// Data Access validity
//

Scenario('Register SA for invalid data access @reqGoogle', async (fence, users) => {
  // Register service account for an invalid data access
  // Registration should fail

  // check project_access

  const googleProject = fence.props.googleProjectA;

  // Setup
  await fence.complete.forceLinkGoogleAcct(
    users.mainAcct,
    googleProject.owner,
  );

  // Register account with an invalid type service account
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.mainAcct,
    googleProject,
    ['FakeProject'],
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountInvalidProject);
});

Scenario('Register SA for data access when requesting user does not have privilege @reqGoogle', async (fence, users) => {
  // Register service account for a data access the user does not have access to
  // Registration should fail

  // check project_access

  const googleProject = fence.props.googleProjectA;

  // Setup
  await fence.complete.forceLinkGoogleAcct(
    users.auxAcct1,
    googleProject.owner,
  );

  // Register account with an invalid type service account
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.auxAcct1,
    googleProject,
    ['DEV'],
  );
  fence.ask.responsesEqual(
    registerRes,
    fence.props.resRegisterServiceAccountMissingProjectPrivilege,
  );
});

Scenario('Register SA for data access where one Project member does not have privilege @reqGoogle', async (fence, users, google) => {
  const googleProject = fence.props.googleProjectA;
  const userWithPrivilege = users.mainAcct;
  const userWithoutPrivilege = users.auxAcct1;

  //does NOT have privilege for requested commons proj
  const commonsProjectAccessList = ['DEV'];

  // Setup
  await fence.complete.forceLinkGoogleAcct(
    userWithPrivilege,
    googleProject.owner,
  );
  // Add another email to the GCP for us to link to
  // Find a user's google email meeting following conditions
  //   -an email that is NOT the owner of the google project
  //   -an email that is NOT the email of the userWithoutPrivilege
  //   -an email that is NOT the email of the userWithPrivilege
  // It is assumed that all users' usernames are google account emails
  const differentGoogleEmail = Object.values(users).find(user =>
    user.username !== googleProject.owner &&
    user.username !== userWithoutPrivilege.username &&
    user.username !== userWithPrivilege.username,
  ).username;
  if (differentGoogleEmail === undefined) {
    throw "Unable to find a user to add to Google project";
  }
  const newRole = {
    role: 'roles/viewer',
    members: [`user:${differentGoogleEmail}`],
  };
  await google.updateUserRole(googleProject.id, newRole);

  // Link to the email
  await fence.complete.forceLinkGoogleAcct(userWithoutPrivilege, differentGoogleEmail);

  // Register account for a commons project one user does not have access to
  const registerRes = await fence.do.registerGoogleServiceAccount(
    userWithPrivilege,
    googleProject,
    commonsProjectAccessList,
  );
  fence.ask.responsesEqual(
    registerRes,
    fence.props.resRegisterServiceAccountMissingProjectPrivilege,
  );
}).retry(2);

//
// Delete Service Account tests
//

Scenario('Attempt delete Registered SA for Google Project when user isnt on the Project @reqGoogle', async (fence, users) => {
  // Delete a service account when user is not linked to a member of the google project
  // Deletion should fail

  const googleProject = fence.props.googleProjectA;

  // Setup
  await fence.complete.forceLinkGoogleAcct(users.mainAcct, googleProject.owner);

  // Register account
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.mainAcct,
    googleProject,
    ['test'],
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountSuccess);

  // Unlink account
  await fence.complete.unlinkGoogleAcct(users.mainAcct);

  // Try to delete registration
  const deleteRes = await fence.do.deleteGoogleServiceAccount(
    users.mainAcct,
    googleProject.serviceAccountEmail,
  );
  fence.ask.responsesEqual(deleteRes, fence.props.resDeleteServiceAccountWhenNotLinked);

  // Clean up by relinking and deleting SA
  await fence.complete.forceLinkGoogleAcct(users.mainAcct, googleProject.owner);
  const actuallyDeleteRes = await fence.do.deleteGoogleServiceAccount(
    users.mainAcct,
    googleProject.serviceAccountEmail,
  );
  fence.ask.responsesEqual(actuallyDeleteRes, fence.props.resDeleteServiceAccountSuccess);
});

Scenario('Attempt delete an SA that doesnt exist @reqGoogle', async (fence, users) => {
  // Delete a service account that doesn't exist
  // Deletion should fail

  const googleProject = fence.props.googleProjectA;

  // Setup
  await fence.complete.forceLinkGoogleAcct(users.mainAcct, googleProject.owner);

  // Try to delete a fake registration
  const deleteRes = await fence.do.deleteGoogleServiceAccount(
    users.mainAcct,
    'notARealServiceAccount@fake.com',
  );
  fence.ask.responsesEqual(deleteRes, fence.props.resDeleteServiceAccountNotRegistered);
});


Scenario('Delete a SA that was successfully registered before but was deleted from Google @reqGoogle', async (fence, users, google) => {
  // Delete a service account that doesn't exist

  // Lock the project
  const googleProject = fence.props.googleProjectDynamic;
  lockRes = await google.lockGoogleProject(googleProject);
  chai.expect(lockRes, 'Could not lock project').to.be.true;

  const serviceAccountName = 'tmp-service-account';
  const serviceAccountEmail = `${serviceAccountName}@${googleProject.serviceAccountEmail.substring(googleProject.serviceAccountEmail.indexOf('@')+1)}`;
  
  const createRes = await google.createServiceAccount(googleProject.id, serviceAccountName);
  if (typeof createRes === 'object' && createRes instanceof Error && createRes.message.match(/already exist/)) {
    console.log(`${serviceAccountEmail} service account already exists`);
  } else {
    fence.ask.createServiceAccountSuccess(createRes, serviceAccountName)
    expect(createRes.email).to.equal(serviceAccountEmail);
  }
  await fence.complete.forceLinkGoogleAcct(users.mainAcct, googleProject.owner);

  // Register account
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.mainAcct,
    googleProject,
    ['test'],
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountSuccess);

  // Remove account from Google but NOT through fence
  const deleteResGoogle = await google.deleteServiceAccount(googleProject.id, serviceAccountEmail);
  fence.ask.deleteServiceAccountSuccess(deleteResGoogle);

  // Delete registration through fence
  // this should succeed even though the account doesn't exist in google
  const deleteRes = await fence.do.deleteGoogleServiceAccount(
    users.mainAcct,
    googleProject.serviceAccountEmail,
  );
  fence.ask.responsesEqual(deleteRes, fence.props.resDeleteServiceAccountSuccess);

  // Unlock the project
  let unlockRes = await google.unlockGoogleProject(googleProject);
  chai.expect(unlockRes, 'Could not unlock project').to.be.true;
});

//
// Service Account expiration tests
//

Scenario('Service Account registration expiration test @reqGoogle', async (fence, users, google, files) => {
  // Test that we do not have access to data anymore after the SA is expired

  const EXPIRES_IN = 5;

  // Lock the project
  const googleProject = fence.props.googleProjectDynamic;
  lockRes = await google.lockGoogleProject(googleProject);
  chai.expect(lockRes, 'Could not lock project').to.be.true;

  // Setup
  await fence.complete.forceLinkGoogleAcct(users.user0, googleProject.owner);

  // Register account
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.user0,
    googleProject,
    ['QA'],
    EXPIRES_IN
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountSuccess);

  // Get creds to access data
  let [pathToKeyFile, keyFullName] = await google.createServiceAccountKeyFile(googleProject);

  // Access data
  user0AccessQARes = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToKeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName
  );

  // Wait for the link to expire
  console.log('waiting for the link to expire');
  await apiUtil.sleepMS(EXPIRES_IN * 1000);

  // Run the expired SA clean up job
  console.log('Clean up expired Service Accounts');
  bash.runJob('google-delete-expired-service-account-job');
  await apiUtil.sleepMS(5 * 1000); // wait for propagation to google
  
  // try to access data
  user0AccessQAResExpired = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToKeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName
  );

  // Clean up
  console.log('cleaning up');

  await google.deleteServiceAccountKey(keyFullName);
  files.deleteFile(pathToKeyFile);

  // should have been deleted by the google-delete-expired-service-account-job
  // send delete request just in case (do not check if it was actually deleted)
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
    'User should have bucket access before expiration'
  ).to.have.property('id');
  chai.expect(user0AccessQAResExpired,
    'User should NOT have bucket access after expiration'
  ).to.have.property('statusCode', 403);
  chai.expect(unlockRes, 'Could not unlock project').to.be.true;
});


Scenario('Service Account temporary key expiration test @reqGoogle', async (fence, users, google, files) => {
  // Test that we do not have access to data anymore after the SA key is expired

  const EXPIRES_IN = 5;
  const googleProject = fence.props.googleProjectA;

  // Setup
  await fence.complete.forceLinkGoogleAcct(users.user0, googleProject.owner);

  // Register account
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.user0,
    googleProject,
    ['QA']
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountSuccess);

  // Access data

  // save temporary google creds to file
  const tempCreds0Res = await fence.complete.createTempGoogleCreds(users.user0.accessTokenHeader, EXPIRES_IN);
  let getCreds0Res = await fence.do.getUserGoogleCreds(users.user0.accessTokenHeader);
  const creds0Key = tempCreds0Res.body.private_key_id;
  const pathToCreds0KeyFile = creds0Key + '.json';
  await files.createTmpFile(pathToCreds0KeyFile, JSON.stringify(tempCreds0Res.body));
  console.log(`Google creds file ${pathToCreds0KeyFile} saved!`);

  user0AccessQARes = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToCreds0KeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName
  );

  // Wait for the key to expire
  console.log('waiting for the key to expire');
  await apiUtil.sleepMS((EXPIRES_IN + 5) * 1000);

  // Run the expired SA key clean up job
  console.log('Clean up expired Service Account keys');
  bash.runJob('google-manage-keys-job');

  getCreds0Res = await fence.do.getUserGoogleCreds(users.user0.accessTokenHeader);
  console.log(getCreds0Res);

  // Try to access data
  user0AccessQAResExpired = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToCreds0KeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName
  );

  // Clean up
  console.log('cleaning up');

  // should have been deleted by the google-manage-keys-job
  // send delete request just in case (do not check if it was actually deleted)
  await fence.complete.deleteTempGoogleCreds(
    creds0Key, users.user0.accessTokenHeader);

  files.deleteFile(pathToCreds0KeyFile);

  await fence.do.deleteGoogleServiceAccount(
    users.user0,
    googleProject.serviceAccountEmail,
  );

  await fence.do.unlinkGoogleAcct(
    users.user0,
  );

  // Asserts
  chai.expect(user0AccessQARes,
    'User should have bucket access before expiration'
  ).to.have.property('id');
  chai.expect(user0AccessQAResExpired,
    'User should NOT have bucket access after expiration'
  ).to.have.property('statusCode', 403);
});
