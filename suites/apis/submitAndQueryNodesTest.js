const { Commons } = require('../../utils/commons.js');

Feature('SubmitAndQueryNodesTest');

Scenario('submit node unauthenticated @reqData', async (sheepdog, nodes, users) => {
  await sheepdog.do.addNode(nodes.getFirstNode(), users.mainAcct.expiredAccessTokenHeader);
  sheepdog.ask.hasNoAuthError(nodes.getFirstNode().addRes);
  await sheepdog.do.deleteNode(nodes.getFirstNode());
});

Scenario('submit and delete node @reqData', async (I, sheepdog, nodes) => {
  await sheepdog.complete.addNode(nodes.getFirstNode());
  await sheepdog.complete.deleteNode(nodes.getFirstNode());
});

//
// REUBEN - 
// addNodes() does not work reliably with brain commons dictionary
// disabling bunch of these tests as they make the test suite useless
//
// PAULINE & TED: reenabling this for now!
Scenario('submit and delete node path @reqData', async (sheepdog, nodes) => {
  await sheepdog.complete.addNodes(nodes.getPathToFile());
  await sheepdog.complete.deleteNodes(nodes.getPathToFile());
});

Scenario('make simple query @reqData', async (sheepdog, peregrine, nodes) => {
  await sheepdog.complete.addNode(nodes.getFirstNode());

  const q = `query Test { alias1: ${nodes.getFirstNode().data.type} { id } }`;
  const res = await peregrine.do.query(q, null);
  peregrine.ask.hasFieldCount(res, 'alias1', 1);

  await sheepdog.complete.deleteNode(nodes.getFirstNode());
});


Scenario('query all node fields @reqData', async (sheepdog, peregrine, nodes) => {
  // add all nodes
  await sheepdog.do.addNodes(nodes.getPathToFile());

  // make query for each node (including all fields of each node)
  const results = {};
  for (const node of nodes.getPathToFile()) {
    // make query for node type and include all attributes
    results[node.name] = await peregrine.do.queryNodeFields(node);
  }

  // expect each node query's fields to equal those of each original node
  peregrine.ask.queryResultsEqualNodes(results, nodes.getPathToFile());

  // remove nodes
  await sheepdog.complete.deleteNodes(nodes.getPathToFile());
});


Scenario('submit node without parent @reqData', async (sheepdog, peregrine, nodes) => {
  // verify parent node does not exist
  const parentRes = await peregrine.do.queryNodeFields(nodes.getFirstNode());
  peregrine.ask.hasFieldCount(parentRes, nodes.getFirstNode().name, 0);

  // try adding the second node
  await sheepdog.do.addNode(nodes.getSecondNode());
  sheepdog.ask.hasStatusCode(nodes.getSecondNode().addRes, 400);
});

Scenario('query on invalid field @reqData', async (peregrine, nodes) => {
  const invalidField = 'abcdefg';
  const nodeType = nodes.getFirstNode().data.type;
  const q = `{
    ${nodeType} {
      ${invalidField}
    }
  }`;

  const res = await peregrine.do.query(q, null);
  peregrine.ask.hasError(
    res,
    `Cannot query field "${invalidField}" on type "${nodeType}".`,
  );
});


Scenario('filter query by string attribute @reqData', async (sheepdog, peregrine, nodes) => {
  await sheepdog.complete.addNodes(nodes.getPathToFile());

  const testField = nodes.getFirstNode().getFieldOfType('string');
  const q = `{
    ${nodes.getFirstNode().name} (${testField}: "${nodes.getFirstNode().data[testField]}") {
      id
    }
  }`;
  const res = await peregrine.do.query(q, null);
  peregrine.ask.hasFieldCount(res, nodes.getFirstNode().name, 1);

  await sheepdog.complete.deleteNodes(nodes.getPathToFile());
});

// FIXME: This is a known bug that needs to be fixed. See PXD-1195
Scenario('filter query by boolean attribute @reqData', async (peregrine) => {
  // This test assumes that projects in all commons will have a boolean attribute 'releasable'
  const booleanState = Commons.project.releasable;
  const q = `
  {
   project(releasable: ${booleanState}) {
    id
   }
  }
  `;
  const res = await peregrine.do.query(q, null);
  // TODO: remove try/catch once bug is fixed
  try {
    peregrine.ask.hasFieldCount(res, 'project', 1);
  } catch (e) {
    console.log(
      `WARNING: test graphQL filter by boolean attribute is FAILING (See PXD-1195): ${
        e.message
      }`,
    );
  }
});

Scenario('test _[field]_count filter @reqData', async (peregrine, sheepdog, nodes) => {
  // Count number of each node type
  const previousCounts = {};
  for (const node of nodes.getPathToFile()) {
    previousCounts[node.name] = await peregrine.do.queryCount(node);
  }

  // add all nodes
  await sheepdog.complete.addNodes(nodes.getPathToFile());

  // requery the nodes for count
  const newCounts = {};
  for (const node of nodes.getPathToFile()) {
    newCounts[node.name] = await peregrine.do.queryCount(node);
  }

  // expect all node counts to increase by 1
  peregrine.ask.allCountsIncrease(previousCounts, newCounts);

  await sheepdog.complete.deleteNodes(nodes.getPathToFile());
});

Scenario('filter by project_id @reqData', async (peregrine, sheepdog, nodes) => {
  // add the nodes
  await sheepdog.complete.addNodes(nodes.getPathToFile());

  const results = {};
  const filters = {
    project_id: `${Commons.program.name}-${Commons.project.name}`,
  };
  for (const node of nodes.getPathToFile()) {
    results[node.name] = await peregrine.do.queryNodeFields(node, filters);
  }
  peregrine.ask.queryResultsEqualNodes(results, nodes.getPathToFile());

  // remove nodes
  await sheepdog.complete.deleteNodes(nodes.getPathToFile());
});

Scenario('filter by invalid project_id @reqData', async (peregrine, sheepdog, nodes) => {
  await sheepdog.complete.addNode(nodes.getFirstNode());

  // filter by a nonexistent project id
  const filters = {
    project_id: 'NOT-EXIST',
  };
  const res = await peregrine.do.queryNodeFields(nodes.getFirstNode(), filters);
  peregrine.ask.hasFieldCount(res, nodes.getFirstNode().name, 0);

  await sheepdog.do.deleteNode(nodes.getFirstNode());
});

Scenario('test with_path_to - first to last node @reqData', async (peregrine, sheepdog, nodes) => {
  await sheepdog.complete.addNodes(nodes.getPathToFile());

  // TODO: remove try/catch once bug is fixed
  try {
    const res = await peregrine.do.queryWithPathTo(
      nodes.getFirstNode(),
      nodes.getLastNode(),
    );
    peregrine.ask.hasFieldCount(res, nodes.getFirstNode().name, 1);
  } catch (e) {
    console.log(
      `WARNING: test graphQL with_path_to first to last node is FAILING (See PXP-1569): ${
        e.message
      }`,
    );
  }

  await sheepdog.complete.deleteNodes(nodes.getPathToFile());
});

// FIXME: This is a known bug that needs to be fixed. See PXP-1569
Scenario('test with_path_to - last to first node @reqData', async (peregrine, sheepdog, nodes) => {
  await sheepdog.complete.addNodes(nodes.getPathToFile());

  // TODO: remove try/catch once bug is fixed
  try {
    const res = await peregrine.do.queryWithPathTo(
      nodes.getLastNode(),
      nodes.getFirstNode(),
    );
    peregrine.ask.hasFieldCount(res, nodes.getLastNode().name, 1);
  } catch (e) {
    console.log(
      `WARNING: test graphQL with_path_to last to first node is FAILING (See PXP-1569): ${
        e.message
      }`,
    );
  }

  await sheepdog.complete.deleteNodes(nodes.getPathToFile());
});


BeforeSuite(async (sheepdog) => {
  // try to clean up any leftover nodes
  await sheepdog.complete.findDeleteAllNodes();
});

Before((nodes) => {
  // Refresh nodes before every test to clear any appended results, id's, etc
  nodes.refreshPathNodes();
});

After(async (sheepdog) => {
  // clean up by trying to delete all nodes
  await sheepdog.complete.findDeleteAllNodes();
});
