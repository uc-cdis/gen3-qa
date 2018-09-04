Feature('SubmitAndQueryNodesTest');

Scenario('submit node unauthenticated @lookitme', async (sheepdog, nodes, users) => {
  await sheepdog.do.addNode(nodes.getFirstNode(), users.mainAcct.expiredAccessTokenHeader);
  sheepdog.ask.hasNoAuthError(nodes.getFirstNode().addRes);
  await sheepdog.do.deleteNode(nodes.getFirstNode());
});

Scenario('submit and delete node @lookitme', async (I, sheepdog, nodes) => {
  await sheepdog.complete.addNode(nodes.getFirstNode());
  await sheepdog.complete.deleteNode(nodes.getFirstNode());
});

Scenario('submit and delete node path', async (sheepdog, nodes) => {
  await sheepdog.complete.addNodes(nodes.getPathToFile());
  await sheepdog.complete.deleteNodes(nodes.getPathToFile());
});

Scenario('make simple query', async (sheepdog, peregrine, nodes) => {
  await sheepdog.complete.addNode(nodes.getFirstNode());

  const q = `query Test { alias1: ${nodes.getFirstNode().data.type} { id } }`;
  const res = await peregrine.do.query(q, null);
  peregrine.ask.hasFieldCount(res, 'alias1', 1);

  await sheepdog.complete.deleteNode(nodes.getFirstNode());
});

Scenario('query all node fields', async (sheepdog, peregrine, nodes) => {
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

Scenario('submit node without parent', async (sheepdog, peregrine, nodes) => {
  // verify parent node does not exist
  const parentRes = await peregrine.do.queryNodeFields(nodes.getFirstNode());
  peregrine.ask.hasFieldCount(parentRes, nodes.getFirstNode().name, 0);

  // try adding the second node
  await sheepdog.do.addNode(nodes.getSecondNode());
  sheepdog.ask.hasEntityError(nodes.getSecondNode().addRes, 'INVALID_LINK');
});

Scenario('query on invalid field', async (peregrine, nodes) => {
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

Scenario('filter query by string attribute', async (sheepdog, peregrine, nodes) => {
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
Scenario('filter query by boolean attribute', async (commons, peregrine) => {
  // This test assumes that projects in all commons will have a boolean attribute 'releasable'
  const booleanState = commons.project.releasable;
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

Scenario('test _[field]_count filter', async (peregrine, sheepdog, nodes) => {
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

Scenario('filter by project_id', async (peregrine, sheepdog, nodes, commons) => {
  // add the nodes
  await sheepdog.complete.addNodes(nodes.getPathToFile());

  const results = {};
  const filters = {
    project_id: `${commons.program.name}-${commons.project.name}`,
  };
  for (const node of nodes.getPathToFile()) {
    results[node.name] = await peregrine.do.queryNodeFields(node, filters);
  }
  peregrine.ask.queryResultsEqualNodes(results, nodes.getPathToFile());

  // remove nodes
  await sheepdog.complete.deleteNodes(nodes.getPathToFile());
});

Scenario('filter by invalid project_id', async (peregrine, sheepdog, nodes) => {
  await sheepdog.complete.addNode(nodes.getFirstNode());

  // filter by a nonexistent project id
  const filters = {
    project_id: 'NOT-EXIST',
  };
  const res = await peregrine.do.queryNodeFields(nodes.getFirstNode(), filters);
  peregrine.ask.hasFieldCount(res, nodes.getFirstNode().name, 0);

  await sheepdog.do.deleteNode(nodes.getFirstNode());
});

Scenario('test with_path_to - first to last node', async (peregrine, sheepdog, nodes) => {
  await sheepdog.complete.addNodes(nodes.getPathToFile());

  const res = await peregrine.do.queryWithPathTo(
    nodes.getFirstNode(),
    nodes.getLastNode(),
  );
  peregrine.ask.hasFieldCount(res, nodes.getFirstNode().name, 1);

  await sheepdog.complete.deleteNodes(nodes.getPathToFile());
});

// FIXME: This is a known bug that needs to be fixed. See PXD-1196
Scenario('test with_path_to - last to first node', async (peregrine, sheepdog, nodes) => {
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
      `WARNING: test graphQL with_path_to last to first node is FAILING (See PXD-1196): ${
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
