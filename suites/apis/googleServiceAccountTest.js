Feature('RegisterGoogleServiceAccount');

BeforeSuite(async (google, fence, users) => {
  // unlink all google accounts
  const unlinkPromises = Object.values(users).map(user => fence.do.unlinkGoogleAcct(user));

  const googleProjects = [fence.props.googleProjectA];
  // remove unimportant roles from google projects
  const removeUsersPromises = googleProjects.map(proj => google.removeAllOptionalUsers(proj.id));
  // delete all service accounts from fence
  const deletePromises = googleProjects.map(proj =>
    fence.do.deleteGoogleServiceAccount(users.mainAcct, proj.serviceAccountEmail),
  );
  await Promise.all(deletePromises.concat(removeUsersPromises, unlinkPromises));
});

After(async (google, fence, users) => {
  // unlink all google accounts
  const unlinkPromises = Object.values(users).map(user => fence.do.unlinkGoogleAcct(user));

  const googleProjects = [fence.props.googleProjectA];
  // remove unimportant roles from google projects
  const removeUsersPromises = googleProjects.map(proj => google.removeAllOptionalUsers(proj.id));
  // delete all service accounts from fence
  const deletePromises = googleProjects.map(proj =>
    fence.do.deleteGoogleServiceAccount(users.mainAcct, proj.serviceAccountEmail),
  );
  await Promise.all(deletePromises.concat(removeUsersPromises, unlinkPromises));
});

// Scenario('Test add SA to project', async (fence, google) => {
//   const binding = {
//     role: 'roles/viewer',
//     members: ['user:tsummer2@uchicago.edu'],
//   };
//   const updateRes = await google.updateUserRole(fence.props.googleProjectAID, binding);
//   console.log('update res', JSON.stringify(updateRes, null, 2));
//
//   const removeBinding = {
//     role: 'roles/viewer',
//     members: ['user:tsummer2@uchicago.edu'],
//   };
//   const removeRes = await google.removeUserRole(fence.props.googleProjectAID, removeBinding);
//   console.log('remove res', JSON.stringify(removeRes, null, 2));
// });

// Scenario('Developing features', async (fence, users) => {
//   await fence.complete.forceLinkGoogleAcct(users.mainAcct, fence.props.googleProjectA.owner);
//   const deleteRes = await fence.do.deleteGoogleServiceAccount(
//     users.mainAcct,
//     fence.props.googleProjectA.serviceAccountEmail,
//   );
//   console.log('delete sa res:\n', JSON.stringify(deleteRes, null, 2));
//
//   const registerRes = await fence.do.registerGoogleServiceAccount(
//     users.mainAcct,
//     fence.props.googleProjectA,
//     ['test'],
//   );
//   console.log('Register Service Account Result:\n', JSON.stringify(registerRes, null, 2));
//
//   const getRes = await fence.do.getGoogleServiceAccounts(
//     users.mainAcct,
//     [fence.props.googleProjectA.id],
//   );
//   console.log('Get sa result:\n ', JSON.stringify(getRes, null, 2));
//
//   fence.complete.unlinkGoogleAcct(users.mainAcct);
//
//   const monitorRes = await fence.do.getGoogleServiceAccountMonitor(users.mainAcct);
//   console.log('monitor res:\n', monitorRes);
// });

Scenario('Register Google Service Account successfully @WIP', async (fence, users) => {
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

Scenario('Register Google Service Account with unlinked account Failure', async (fence, users) => {
  // note that we are not linking here, so the GCP owner is unlinked

  // Register account
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.mainAcct,
    fence.props.googleProjectA,
    ['test'],
  );
  fence.ask.responsesEqual(registerRes, fence.props.resRegisterServiceAccountNotLinked);
});

Scenario('Register Google Service Account with GCP has parent org Failure', async (fence, users) => {
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

Scenario('Register Google Service Account with GCP not linked to fence @WIP', async (fence, users) => {
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

Scenario('Register Google Service Account that does not belong to GCP @WIP', async (fence, users) => {
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

Scenario('Register Google Service Account of invalid type @WIP', async (fence, users) => {
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

Scenario('Register Google Service Account which has key @WIP', async (fence, users) => {
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

Scenario('Register Google Service Account for invalid commons project @WIP', async (fence, users) => {
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

Scenario('Register Google Service Account for invalid commons project @WIP', async (fence, users) => {
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

Scenario('Register Google Service Account for commons project without privilege @WIP', async (fence, users) => {
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

// try without proper scope
// try to delete when google acct is not linked
// try to delete a non linked service account email
