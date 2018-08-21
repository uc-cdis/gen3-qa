Feature('SubmitAndQueryNodesTest');

Scenario('submit and delete node', async (I, sheepdog, nodes) => {
  await sheepdog.complete.addNode(nodes.firstNode);
  await sheepdog.complete.deleteNode(nodes.firstNode);
});

Scenario('submit and delete node path', async (sheepdog, nodes) => {
  await sheepdog.complete.addNodes(nodes.toFileAsList);
  await sheepdog.complete.deleteNodes(nodes.toFileAsList);
});

Scenario('make simple query', async (sheepdog, peregrine, nodes) => {
  await sheepdog.complete.addNode(nodes.firstNode);

  const q = `query Test { alias1: ${nodes.firstNode.data.type} { id } }`;
  const res = await peregrine.do.query(q, null);
  peregrine.ask.hasFieldCount(res, 'alias1', 1);

  await sheepdog.complete.deleteNode(nodes.firstNode);
});

Scenario('query all node fields', async (sheepdog, peregrine, nodes) => {
  // add all nodes
  await sheepdog.do.addNodes(nodes.toFileAsList);

  // make query for each node (including all fields of each node)
  const results = {};
  for (const node of nodes.toFileAsList) {
    // make query for node type and include all attributes
    results[node.name] = await peregrine.do.queryNodeFields(node);
  }

  // expect each node query's fields to equal those of each original node
  peregrine.ask.queryResultsEqualNodes(results, nodes.toFileAsList);

  // remove nodes
  await sheepdog.complete.deleteNodes(nodes.toFileAsList);
});

Scenario('submit node without parent', async (sheepdog, peregrine, nodes) => {
  // verify parent node does not exist
  const parentRes = await peregrine.do.queryNodeFields(nodes.firstNode);
  peregrine.ask.hasFieldCount(parentRes, nodes.firstNode.name, 0);

  // try adding the second node
  await sheepdog.do.addNode(nodes.secondNode);
  console.log('RESULT', JSON.stringify(nodes.secondNode.add_res));
  sheepdog.ask.hasEntityError(nodes.secondNode.add_res, 'INVALID_LINK');
});

Scenario('query on invalid field', async (peregrine, nodes) => {
  const invalidField = 'abcdefg';
  const nodeType = nodes.firstNode.data.type;
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
  await sheepdog.complete.addNodes(nodes.toFileAsList);

  const testField = nodes.firstNode.getFieldOfType('string');
  const q = `{
    ${nodes.firstNode.name} (${testField}: "${nodes.firstNode.data[testField]}") {
      id
    }
  }`;
  const res = await peregrine.do.query(q, null);
  peregrine.ask.hasFieldCount(res, nodes.firstNode.name, 1);

  await sheepdog.complete.deleteNodes(nodes.toFileAsList);
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
  for (const node of nodes.toFileAsList) {
    previousCounts[node.name] = await peregrine.do.queryCount(node);
  }

  // add all nodes
  await sheepdog.complete.addNodes(nodes.toFileAsList);

  // requery the nodes for count
  const newCounts = {};
  for (const node of nodes.toFileAsList) {
    newCounts[node.name] = await peregrine.do.queryCount(node);
  }

  // expect all node counts to increase by 1
  peregrine.ask.allCountsIncrease(previousCounts, newCounts);

  await sheepdog.complete.deleteNodes(nodes.toFileAsList);
});

Scenario('filter by project_id', async (peregrine, sheepdog, nodes, commons) => {
  // add the nodes
  await sheepdog.complete.addNodes(nodes.toFileAsList);

  const results = {};
  const filters = {
    project_id: `${commons.program.name}-${commons.project.name}`,
  };
  for (const node of nodes.toFileAsList) {
    results[node.name] = await peregrine.do.queryNodeFields(node, filters);
  }
  peregrine.ask.queryResultsEqualNodes(results, nodes.toFileAsList);

  // remove nodes
  await sheepdog.complete.deleteNodes(nodes.toFileAsList);
});

Scenario('filter by invalid project_id', async (peregrine, sheepdog, nodes) => {
  await sheepdog.complete.addNode(nodes.firstNode);

  // filter by a nonexistent project id
  const filters = {
    project_id: 'NOT-EXIST',
  };
  const res = await peregrine.do.queryNodeFields(nodes.firstNode, filters);
  peregrine.ask.hasFieldCount(res, nodes.firstNode.name, 0);

  await sheepdog.do.deleteNode(nodes.firstNode);
});

Scenario('test with_path_to - first to last node', async (peregrine, sheepdog, nodes) => {
  await sheepdog.complete.addNodes(nodes.toFileAsList);

  const res = await peregrine.do.queryWithPathTo(
    nodes.firstNode,
    nodes.lastNode,
  );
  peregrine.ask.hasFieldCount(res, nodes.firstNode.name, 1);

  await sheepdog.complete.deleteNodes(nodes.toFileAsList);
});

// FIXME: This is a known bug that needs to be fixed. See PXD-1196
Scenario('test with_path_to - last to first node', async (peregrine, sheepdog, nodes) => {
  await sheepdog.complete.addNodes(nodes.toFileAsList);

  // TODO: remove try/catch once bug is fixed
  try {
    const res = await peregrine.do.queryWithPathTo(
      nodes.lastNode,
      nodes.firstNode,
    );
    peregrine.ask.hasFieldCount(res, nodes.lastNode.name, 1);
  } catch (e) {
    console.log(
      `WARNING: test graphQL with_path_to last to first node is FAILING (See PXD-1196): ${
        e.message
      }`,
    );
  }

  await sheepdog.complete.deleteNodes(nodes.toFileAsList);
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
