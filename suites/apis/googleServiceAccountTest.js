Feature('GoogleServiceAccount');

Scenario('Test add SA to project @special123', async (fence) => {
  const members = await fence.complete.getProjectMembers(fence.props.project1ID);
  console.log('Found members', members);
});
