Feature('RegisterGoogleServiceAccount');

Scenario('Test add SA to project @reqGoogle', async (fence, google) => {
  const binding = {
    role: 'roles/viewer',
    members: ['user:tsummer2@uchicago.edu'],
  };
  const updateRes = await google.updateUserRole(fence.props.googleProjectAID, binding);
  console.log('update res', JSON.stringify(updateRes, null, 2));

  const removeBinding = {
    role: 'roles/viewer',
    members: ['user:tsummer2@uchicago.edu'],
  };
  const removeRes = await google.removeUserRole(fence.props.googleProjectAID, removeBinding);
  console.log('remove res', JSON.stringify(removeRes, null, 2));
});

Scenario('Register SA successfully @reqGoogle @WIP', async (fence, users) => {
  await fence.complete.forceLinkGoogleAcct(users.mainAcct, fence.props.googleProjectA.owner);
  const deleteRes = await fence.do.deleteGoogleServiceAccount(
    users.mainAcct,
    fence.props.googleProjectA.serviceAccountEmail,
  );
  console.log('delete sa res:\n', JSON.stringify(deleteRes, null, 2));

  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.mainAcct,
    fence.props.googleProjectA,
    ['test'],
  );
  console.log('Register Service Account Result:\n', JSON.stringify(registerRes, null, 2));

  const getRes = await fence.do.getGoogleServiceAccounts(
    users.mainAcct,
    [fence.props.googleProjectA.id],
  );
  console.log('Get sa result:\n ', JSON.stringify(getRes, null, 2));

  fence.complete.unlinkGoogleAcct(users.mainAcct);

  const monitorRes = await fence.do.getGoogleServiceAccountMonitor(users.mainAcct);
  console.log('monitor res:\n', monitorRes);
});

// try without proper scope
// try to delete when google acct is not linked
// try to delete a non linked service account email
