'use strict';

let nodes, nodes_list;

Feature('Core Metadata');

Scenario('test core metadata page', async(I) => {

  // submit files
  await I.addNodes(I.getSheepdogRoot(), nodes_list);
  I.seeAllNodesAddSuccess(nodes_list);

  I.goToFiles();
  I.loadFiles();

  var fileNames = await I.grabTextFrom('//tr/td[2]');
  I.clickAFile(fileNames);
  I.loadCoreMetadata();

  I.click('.boRitF'); // click back link
  I.loadFiles();

  // delete files
  await I.deleteNodes(I.getSheepdogRoot(), nodes_list);
  I.seeAllNodesDeleteSuccess(nodes_list);

});

BeforeSuite(async (I) => {
  // try to clean up any leftover nodes
  await I.findDeleteAllNodes();
});

Before((I) => {
  // load test data
  nodes = I.getNodePathToFile();
  nodes_list = I.sortNodes(Object.values(nodes));
});

AfterSuite(async (I) => {
  await I.findDeleteAllNodes();
});
