Feature('GoogleServiceAccount');

/**
 * need to have at least two users in a google project
 * test service acct: both users need to have access
 */

Scenario('test create APIKey success @Testing123', async (fence) => {
  // Do nothing atm
  console.log(process.env.GOOGLE_APP_EMAIL);
  console.log(process.env.GOOGLE_APP_PRIVATE_KEY);
  await fence.ask.projectHasUser('abcdefg');
});
