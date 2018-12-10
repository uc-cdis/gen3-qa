Feature('Sheepdog API Performance Test');

var nodeToAdd;

Before(async (sheepdog, nodes) => {
  	// Cleanup any leftover nodes from previous Suites
    await sheepdog.complete.findDeleteAllNodes();
    var dataUrlFromEnv = `${process.env.DATAURL}`;
	  nodeToAdd = await nodes.getNodeFromURL(dataUrlFromEnv);
});

After(async (sheepdog, nodes) => {
  	await sheepdog.complete.deleteNodes(nodes.getPathToFile());
    await sheepdog.complete.findDeleteAllNodes();
});

Scenario('submission tiny db @reqData', async (sheepdog, nodes, users) => {
    await sheepdog.do.addNode(nodeToAdd);
});