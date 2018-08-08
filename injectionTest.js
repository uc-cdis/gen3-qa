'use strict';

Feature('Add Nodes');

let first_node = {
  data: {}
};

Scenario('test add node', async (I, sheepdog) => {
  await sheepdog.addNode(first_node);
  sheepdog.seeNodeAddSuccess(first_node);

  await sheepdog.deleteNode(first_node);
  sheepdog.seeNodeDeleteSuccess(first_node);
});

Scenario('test nav page', (I, dictPage) => {
  dictPage.goTo();
  dictPage.seeLoaded();
  dictPage.showGraph();
  dictPage.seeGraph();
});
