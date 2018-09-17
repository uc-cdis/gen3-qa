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
  const linkRes = await fence.complete.forceLinkGoogleAcct(users.mainAcct, { googleCreds: { email: 'ted.summer2@gmail.com' } });
  const registerRes = await fence.do.registerGoogleServiceAccount(
    users.mainAcct,
    fence.props.googleProjectA,
    ['test'],
  );
  console.log('Register Service Account Result:\n', JSON.stringify(registerRes, null, 2));

  fence.complete.unlinkGoogleAcct(users.mainAcct);
});
