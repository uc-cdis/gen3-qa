Feature('CoreMetadataPageTest @requires-indexd @requires-portal @requires-peregrine');

const I = actor();

// test data
let validFile;

BeforeSuite(async ({ nodes, sheepdog }) => {
  await sheepdog.complete.findDeleteAllNodes();
  await sheepdog.complete.addNodes(nodes.getPathToFile());
  validFile = nodes.getFileNode().clone();
  await sheepdog.complete.addNode(validFile);
});

Scenario('test core metadata page @coreMetadataPage @portal', async ({ portalCoreMetadataPage, peregrine, users }) => {
  await home.complete.login();
  const metadata = await peregrine.do.getCoremetadata(validFile, 'application/json', users.mainAcct.accessTokenHeader);
  peregrine.ask.seeJsonCoremetadata(validFile, metadata);
  await portalCoreMetadataPage.complete.checkFileCoreMetadataPage(metadata);
  await home.complete.logout();
});

/* TODO: an optimal test scenario for this core metadata page test is to generate test data,
and then starts from the file explorer page, clicks on an available file record, checks if the
it redirect to core metadata page and finally verifies the page contents.
Unfortunately this cannot be achieved for now since we are pinning ES indices in Jenkins envs
and the file explorer depends on Guppy and ES now.
*/

AfterSuite(async ({ sheepdog }) => {
  try {
    await sheepdog.complete.findDeleteAllNodes();
  } catch (error) {
    console.log(error);
  }
});
