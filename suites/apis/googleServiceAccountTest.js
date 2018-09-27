Feature('GoogleServiceAccount');

Scenario('Test add SA to project @reqGoogle', async (fence, google) => {
  const binding = {
    role: 'roles/viewer',
    members: ['user:ted.summer2@gmail.com'],
  };
  const updateRes = await google.updateUserRole(fence.props.googleProjectAID, binding);
  console.log(updateRes);
});
