// test data
let metadata;

Feature('CoreMetadataPageTest');

const I = actor();

BeforeSuite(async (nodes, sheepdog, pidgin, users) => {
  await sheepdog.complete.findDeleteAllNodes();
  await sheepdog.complete.addNodes(nodes.getPathToFile());
  const validFile = nodes.getFileNode().clone();
  await sheepdog.complete.addNode(validFile);
  metadata = await pidgin.do.getCoremetadata(validFile, 'application/json', users.mainAcct.accessTokenHeader);
});

Before((home) => {
  home.complete.login();
});

Scenario('test core metadata page', async (I) => {

});

After(async (home) => {
  home.complete.logout();
});

AfterSuite(async (sheepdog) => {
  await sheepdog.complete.findDeleteAllNodes();
});
