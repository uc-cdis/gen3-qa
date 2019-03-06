const chai = require('chai');
const expect = chai.expect;


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
});

After(async (google, fence, users) => {
  await suiteCleanup(google, fence, users);
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
});



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
}).retry(4);


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
});

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

  const googleProject = fence.props.googleProjectA;
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
});

