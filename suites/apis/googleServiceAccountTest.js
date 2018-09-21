Feature('RegisterGoogleServiceAccount');

BeforeSuite(async (google, fence, users) => {
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
    // If project has been registered by a user, TRY to delete the service account
    // NOTE: the service account might have been registered unsuccessfully or deleted,
    //  we are just hitting the endpoints as if it still exists and ignoring errors
    if (proj.registerUser) {
      const projUser = proj.registerUser;

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
  }

  // unlink all google accounts
  const unlinkPromises = Object.values(users).map(user => fence.do.unlinkGoogleAcct(user));
  await Promise.all(unlinkPromises);
});

After(async (google, fence, users) => {
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
    // If project has been registered by a user, TRY to delete the service account
    // NOTE: the service account might have been registered unsuccessfully or deleted,
    //  we are just hitting the endpoints as if it still exists and ignoring errors
    if (proj.registerUser) {
      const projUser = proj.registerUser;

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
  }

  // unlink all google accounts
  const unlinkPromises = Object.values(users).map(user => fence.do.unlinkGoogleAcct(user));
  await Promise.all(unlinkPromises);
});

Scenario('Register Google Service Account successfully @reqGoogle', async (fence, users) => {
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

/**
 * Google Project validity
 */

Scenario('Register Google Service Account with unlinked account Failure @reqGoogle', async (fence, users) => {
  // note that we are not linking here, so the GCP owner is unlinked

  // Register account
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.mainAcct,
    fence.props.googleProjectA,
    ['test'],
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountNotLinked);
});

Scenario('Register Google Service Account with linked account not in GCP @reqGoogle', async (fence, users) => {
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

Scenario('Register Google Service Account with GCP has parent org Failure @reqGoogle', async (fence, users) => {
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

Scenario('Register Google Service Account with GCP not linked to fence @reqGoogle', async (fence, users) => {
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

Scenario('Register Google Service Account with GCP having invalid member type @reqGoogle', async (fence, users, google) => {
  const googleProject = fence.props.googleProjectA;

  // Setup
  await fence.complete.forceLinkGoogleAcct(
    users.mainAcct,
    googleProject.owner,
  );
  const bindingWithGroup = {
    role: 'roles/viewer',
    members: ['group:gen3-autoqa@googlegroups.com'],
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

/**
 * Service Account validity
 */

Scenario('Register Google Service Account that does not belong to GCP @reqGoogle', async (fence, users) => {
  const projectA = fence.props.googleProjectA;
  const projectB = fence.props.googleProjectFenceNotRegistered;

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
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountInvalidServiceAcct);
});

Scenario('Register Google Service Account for compute service email Success @reqGoogle', async (fence, users) => {
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
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountInvalidServiceAcct);
});

// Scenario('Register Google Service Account of invalid type (app engine) Failure @reqGoogle',
// async (fence, users) => {
//   const googleProject = fence.props.googleProjectA;
//
//   // Setup
//   await fence.complete.forceLinkGoogleAcct(
//     users.mainAcct,
//     googleProject.owner,
//   );
//
//   // Register account with an invalid type service account
//   const registerRes = await fence.do.registerGoogleServiceAccount(
//     users.mainAcct,
//     {
//       serviceAccountEmail: googleProject.appEngineServiceAccountEmail,
//       id: googleProject.id,
//     },
//     ['test'],
//   );
//   fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountInvalidServiceAcct);
// });

Scenario('Register Google Service Account which has key @reqGoogle', async (fence, users) => {
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

/**
 * Commons project validity
 */

Scenario('Register Google Service Account for invalid commons project @reqGoogle', async (fence, users) => {
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

Scenario('Register Google Service Account for commons project without privilege @reqGoogle', async (fence, users) => {
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

// Scenario('Register Google Service Account for commons project
// where one member does not have privilege @reqGoogle', async (fence, users, google) => {
//   const googleProject = fence.props.googleProjectA;
//   const userWithPrivilege = users.mainAcct;
//   const userWithoutPrivilege = users.auxAcct1;
// //does NOT have privilege for requested commons proj
//   const commonsProjectAccessList = ['DEV'];
//
//   // Setup
//   await fence.complete.forceLinkGoogleAcct(
//     userWithPrivilege,
//     googleProject.owner,
//   );
//   // Add another email to the GCP for us to link to
//   // Find a user's google email meeting following conditions
//   //   -an email that is NOT the owner of the google project
//   //   -an email that is NOT the email of the userWithoutPrivilege
//   //   -an email that is NOT the email of the userWithPrivilege
//   // It is assumed that all users' usernames are google account emails
//   const differentGoogleEmail = Object.values(users).find(user =>
//     user.username !== googleProject.owner &&
//     user.username !== userWithoutPrivilege.username &&
//     user.username !== userWithPrivilege.username,
//   ).username;
//   const newRole = {
//     role: 'roles/viewer',
//     members: [`user:${differentGoogleEmail}`],
//   };
//   await google.updateUserRole(googleProject.id, newRole);
//   // Link to the email
//   await fence.complete.forceLinkGoogleAcct(userWithoutPrivilege, differentGoogleEmail);
//
//   // Register account for a commons project one user does not have access to
//   const registerRes = await fence.do.registerGoogleServiceAccount(
//     userWithPrivilege,
//     googleProject,
//     commonsProjectAccessList,
//   );
//   fence.ask.responsesEqual(
//     registerRes,
//     fence.props.resRegisterServiceAccountMissingProjectPrivilege,
//   );
// });

/**
 * Delete Service Account tests
 */
Scenario('Delete Service Account when not linked Fail @reqGoogle', async (fence, users) => {
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

Scenario('Delete an invalid service account @reqGoogle', async (fence, users) => {
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
