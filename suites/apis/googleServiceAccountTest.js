

Feature('GoogleServiceAccount');

/**
 * need to have at least two users in a google project
 * test service acct: both users need to have access
 */

Scenario('', async (sheepdog, nodes) => {
  // all accounts in a project must be linked??
  await sheepdog.do.addNode(nodes.firstNode);
});
