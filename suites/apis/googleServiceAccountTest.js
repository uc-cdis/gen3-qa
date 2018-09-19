Feature('RegisterGoogleServiceAccount');

BeforeSuite(async (google, fence, users) => {
  const googleProjects = [fence.props.googleProjectA];
  // remove unimportant roles from google projects
  const removeUsersPromises = googleProjects.map(proj => google.removeAllOptionalUsers(proj.id));
  // delete all service accounts from fence
  const deletePromises = googleProjects.map((proj) => {
    if (proj.registerUser) {
      if (!proj.registerUser.linkedGoogleAccount) {
        return fence.do.forceLinkGoogleAcct(proj.registerUser, proj.owner)
          .then(() =>
            fence.do.deleteGoogleServiceAccount(proj.registerUser, proj.serviceAccountEmail),
          );
      }
      return fence.do.deleteGoogleServiceAccount(proj.registerUser, proj.serviceAccountEmail);
    }
    return null;
  });
  await Promise.all(deletePromises.concat(removeUsersPromises));

  // unlink all google accounts
  const unlinkPromises = Object.values(users).map(user => fence.do.unlinkGoogleAcct(user));
  await Promise.all(unlinkPromises);
});

After(async (google, fence, users) => {
  const googleProjects = [fence.props.googleProjectA];
  // remove unimportant roles from google projects
  const removeUsersPromises = googleProjects.map(proj => google.removeAllOptionalUsers(proj.id));
  // delete all service accounts from fence
  const deletePromises = googleProjects.map((proj) => {
    if (proj.registerUser) {
      if (!proj.registerUser.linkedGoogleAccount) {
        return fence.do.forceLinkGoogleAcct(proj.registerUser, proj.owner)
          .then(() =>
            fence.do.deleteGoogleServiceAccount(proj.registerUser, proj.serviceAccountEmail),
          );
      }
      return fence.do.deleteGoogleServiceAccount(proj.registerUser, proj.serviceAccountEmail);
    }
    return null;
  });
  await Promise.all(deletePromises.concat(removeUsersPromises));

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

Scenario('Register Google Service Account of invalid type @reqGoogle', async (fence, users) => {
  const googleProject = fence.props.googleProjectA;

  // Setup
  await fence.complete.forceLinkGoogleAcct(
    users.mainAcct,
    googleProject.owner,
  );

  // Register account with an invalid type service account
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.mainAcct,
    {
      serviceAccountEmail: googleProject.computeServiceAccountEmail,
      id: googleProject.id,
    },
    ['test'],
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountInvalidServiceAcct);
});

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
