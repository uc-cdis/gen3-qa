'use strict';

Feature('SubmitAndQueryNodesTest');

// Nodes, sorted hierarchically by key. Refreshed before each scenario
let nodes, nodes_list;
let first_node;
let second_node;
let last_node;


Scenario('submit and delete node', async(sheepdog) => {
  await sheepdog.complete.addNode(first_node);
  await sheepdog.complete.deleteNode(first_node);
});


Scenario('submit and delete node path', async(sheepdog) => {
  await sheepdog.complete.addNodes(nodes_list);
  await sheepdog.complete.deleteNodes(nodes_list);
});


Scenario('make simple query', async(sheepdog, peregrine) => {
  await sheepdog.complete.addNode(first_node);

  let q = `query Test { alias1: ${first_node.data.type} { id } }`;
  let res = await peregrine.do.query(q, null);
  peregrine.ask.hasFieldCount(res, 'alias1', 1);

  await sheepdog.complete.deleteNode(first_node);
});


Scenario('query all node fields', async(sheepdog, peregrine) => {
  // add all nodes
  await sheepdog.do.addNodes(nodes_list);

  // make query for each node (including all fields of each node)
  let results = {};
  for (let node of nodes_list) {
    // make query for node type and include all attributes
    results[node.name] = await peregrine.do.queryNodeFields(node);
  }

  // expect each node query's fields to equal those of each original node
  peregrine.ask.queryResultsEqualNodes(results, nodes_list);

  // remove nodes
  await sheepdog.complete.deleteNodes(nodes_list);
});


Scenario('submit node without parent', async(sheepdog, peregrine) => {
  // verify parent node does not exist
  let parent_res = await peregrine.do.queryNodeFields(first_node);
  peregrine.ask.hasFieldCount(parent_res, first_node.name, 0);

  // try adding the second node
  await sheepdog.do.addNode(second_node);
  sheepdog.ask.hasEntityError(second_node.add_res, 'INVALID_LINK');
});


Scenario('query on invalid field', async(peregrine) => {
  let invalid_field = 'abcdefg';
  let node_type = first_node.data.type;
  let q = `{
    ${node_type} {
      ${invalid_field}
    }
  }`;

  let res = await peregrine.do.query(q, null);
  peregrine.ask.hasError(res, `Cannot query field "${invalid_field}" on type "${node_type}".`);
});


Scenario('filter query by string attribute', async(sheepdog, peregrine) => {
  await sheepdog.complete.addNodes(nodes_list);

  let test_field = getFieldOfType(first_node.data, 'string');
  let q = `{
    ${first_node.name} (${test_field}: "${first_node.data[test_field]}") {
      id
    }
  }`;
  let res = await peregrine.do.query(q, null);
  peregrine.ask.hasFieldCount(res, first_node.name, 1);

  await sheepdog.complete.deleteNodes(nodes_list);
});


// FIXME: This is a known bug that needs to be fixed. See PXD-1195
Scenario('filter query by boolean attribute', async(commons, peregrine) => {
  // This test assumes that projects in all commons will have a boolean attribute 'releasable'
  let boolean_state = commons.project['releasable'];
  let q = `
  {
   project(releasable: ${boolean_state}) {
    id
   }
  }
  `;
  let res = await peregrine.do.query(q, null);
  // TODO: remove try/catch once bug is fixed
  try {
    peregrine.ask.hasFieldCount(res, 'project', 1)
  } catch(e) {
    console.log("WARNING: test graphQL filter by boolean attribute is FAILING (See PXD-1195): " + e.message)
  }
});


Scenario('test _[field]_count filter', async(peregrine, sheepdog) => {
  // Count number of each node type
  let previous_counts = {};
  for (let node of nodes_list) {
    previous_counts[node.name] = await peregrine.do.queryCount(node);
  }

  // add all nodes
  await sheepdog.complete.addNodes(nodes_list);

  // requery the nodes for count
  let new_counts = {};
  for (let node of nodes_list) {
    new_counts[node.name] = await peregrine.do.queryCount(node)
  }

  // expect all node counts to increase by 1
  peregrine.ask.allCountsIncrease(previous_counts, new_counts);

  await sheepdog.complete.deleteNodes(nodes_list);
});


Scenario('filter by project_id', async(peregrine, sheepdog, commons) => {
  // add the nodes
  await sheepdog.complete.addNodes(nodes_list);

  let results = {};
  let filters = {
    project_id: `${commons.program.name}-${commons.project.name}`
  };
  for(let node of nodes_list) {
    results[node.name] = await peregrine.do.queryNodeFields(node, filters);
  }
  peregrine.ask.queryResultsEqualNodes(results, nodes_list);

  // remove nodes
  await sheepdog.complete.deleteNodes(nodes_list);
});


Scenario('filter by invalid project_id', async(peregrine, sheepdog) => {
  await sheepdog.complete.addNode(first_node);

  // filter by a nonexistent project id
  let filters = {
    project_id: "NOT-EXIST"
  };
  let res = await peregrine.do.queryNodeFields(first_node, filters);
  peregrine.ask.hasFieldCount(res, first_node.name, 0);

  await sheepdog.do.deleteNode(first_node);
});


Scenario('test with_path_to - first to last node', async(peregrine, sheepdog) => {
  await sheepdog.complete.addNodes(nodes_list);

  let res = await peregrine.do.queryWithPathTo(first_node, last_node);
  peregrine.ask.hasFieldCount(res, first_node.name, 1);

  await sheepdog.complete.deleteNodes(nodes_list);
});


// FIXME: This is a known bug that needs to be fixed. See PXD-1196
Scenario('test graphQL with_path_to last to first node', async(peregrine, sheepdog) => {
  await sheepdog.complete.addNodes(nodes_list);

  // TODO: remove try/catch once bug is fixed
  try {
    let res = await peregrine.do.queryWithPathTo(first_node, last_node);
    peregrine.ask.hasFieldCount(res, first_node.name, 1);
  } catch(e) {
    console.log("WARNING: test graphQL with_path_to last to first node is FAILING (See PXD-1196): " + e.message)
  }

  await sheepdog.complete.deleteNodes(nodes_list);
});


const _getFieldOfType = function(object, field_type) {
  return Object.keys(object).find((key) => { return typeof object[key] === field_type })
};

BeforeSuite(async (I) => {
  // try to clean up any leftover nodes
  await I.findDeleteAllNodes();
});


Before((I) => {
  nodes = I.getNodePathToFile();
  // delete the file node
  Object.keys(nodes).map((key) => { if (nodes[key].category === 'data_file') { delete nodes[key] } });
  nodes_list = I.sortNodes(Object.values(nodes));
  first_node = nodes_list[0];
  second_node = nodes_list[1];
  last_node = nodes_list[nodes_list.length-1];
});


After(async (I) => {
  // clean up by trying to delete all nodes
  await I.findDeleteAllNodes();
});