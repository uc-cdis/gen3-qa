Feature('Submission Performance Tests').tag('@regressions');

var nodeToAdd;

var assert = require('assert');

Before(async (sheepdog, nodes) => {
	// Cleanup any leftover nodes from previous Suites
  // await sheepdog.complete.findDeleteAllNodes();
  var dataUrlFromEnv = `${process.env.DATAURL}`;
  nodeToAdd = await nodes.getNodeFromURL(dataUrlFromEnv);
});

Scenario(`(Scenario) Submission tiny db @submissionPerformanceTest ${process.env.NODE} ${process.env.DB} ${process.env.SIZE} @regressions`, async (sheepdog, nodes, users) => {
    //console.log('\n\n\nwhat are we initially adding: ', nodeToAdd);

    nodeToAdd = await sheepdog.do.addNode(nodeToAdd);
    assert.notEqual(nodeToAdd.addRes.body.message, 'internal server error');
    //assert.notEqual(typeof nodeToAdd.data.id, 'undefined');
});

After(async (sheepdog, nodes) => {
  //console.log('\n\nnodeToAdd: ', nodeToAdd);
  //console.log('\n\nnodeToAdd.data: ', nodeToAdd.data);
  // await sheepdog.complete.deleteNode(nodeToAdd);
  // await sheepdog.complete.findDeleteAllNodes();
});