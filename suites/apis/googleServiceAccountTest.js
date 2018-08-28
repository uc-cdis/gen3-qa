

Feature('GoogleServiceAccount');

/**
 * need to have at least two users in a google project
 * test service acct: both users need to have access
 */
Scenario('Test add SA to project @reqGoogle', async (fence) => {
  const members = await fence.complete.getProjectMembers('replace with project name?');
  console.log(members);
  fence.ask.membersHasUser(members, { email: 'dcf-avantoluchicago.edu-6@planx-pla.net' });
});
