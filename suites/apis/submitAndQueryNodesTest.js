'use strict';

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let expect = chai.expect;


Feature('SubmitAndQueryNodesTest');

const getFieldOfType = function(object, field_type) {
  return Object.keys(object).find((key) => { return typeof object[key] === field_type })
};

// Nodes, sorted hierarchically by key. Refreshed before each scenario
let nodes, nodes_list;
let first_node;
let second_node;
let last_node;


Scenario('test node submit unauthenticated', async(I) => {
  return expect(I.sendPostRequest(
    I.getSheepdogRoot(), JSON.stringify(first_node), "")
    .then(
      (res) => {
        return res.body.message;
      }
    ))
    .to.eventually.equal("You don't have access to this data: No authentication is provided");
});


Scenario('test node submit/delete', async(I) => {
  await I.addNode(I.getSheepdogRoot(), first_node);
  I.seeNodeAddSuccess(first_node);

  await I.deleteNode(I.getSheepdogRoot(), first_node);
  I.seeNodeDeleteSuccess(first_node);
});


Scenario('test submit/delete node path', async(I) => {
  await I.addNodes(I.getSheepdogRoot(), nodes_list);
  I.seeAllNodesAddSuccess(nodes_list);

  await I.deleteNodes(I.getSheepdogRoot(), nodes_list, false);
  I.seeAllNodesDeleteSuccess(nodes_list);
});


Scenario('test graphQL not authenticated', async(I) => {
  return expect(I.sendPostRequest(
    "/api/v0/submission/graphql", JSON.stringify({query: null, variables: null}), "")
    .then(
      (res) => {
        return res.body.message;
      }
    ))
    .to.eventually.equal("You don't have access to this data: No authentication is provided");
});


Scenario('test graphQL simple query', async(I) => {
  await I.addNode(I.getSheepdogRoot(), first_node);
  I.seeNodeAddSuccess(first_node);

  let q = `query Test { alias1: ${first_node.data.type} { id } }`;
  let res = await I.makeGraphQLQuery(q, null);
  I.seeNumberOfGraphQLField(res, 'alias1', 1);

  await I.deleteNode(I.getSheepdogRoot(), first_node);
  I.seeNodeDeleteSuccess(first_node);
});


Scenario('test graphQL all node fields', async(I) => {
  // add all nodes
  await I.addNodes(I.getSheepdogRoot(), nodes_list);
  I.seeAllNodesAddSuccess(nodes_list);

  // make query for each node (including all fields of each node)
  let filter_string;
  let results = {};
  for(let type_name of Object.keys(nodes)) {
    // filter by submitter_id
    filter_string = `submitter_id: "${nodes[type_name].data.submitter_id}"`;
    results[type_name] = await I.makeGraphQLNodeQuery(type_name, nodes[type_name], filter_string);
  }

  // expect each node query's fields to equal those of each original node
  I.seeAllGraphQLNodesEqual(nodes, results);

  // remove nodes
  await I.deleteNodes(I.getSheepdogRoot(), nodes_list);
  I.seeAllNodesDeleteSuccess(nodes_list);
});


Scenario('test node submit without parent', async(I) => {
  // verify parent node does not exist
  let parent_res = await I.makeGraphQLNodeQuery(first_node.data.type, first_node, null);
  I.seeNumberOfGraphQLField(parent_res, first_node.data.type, 0);

  // try adding the second node
  await I.addNode(I.getSheepdogRoot(), second_node);
  I.seeSheepdogHasEntityError(second_node.add_res, 'INVALID_LINK');
});


Scenario('test graphQL invalid field', async(I) => {
  let invalid_field = 'abcdefg';
  let node_type = first_node.data.type;
  let q = `{
    ${node_type} {
      ${invalid_field}
    }
  }`;

  let res = await I.makeGraphQLQuery(q, null);

  I.seeGraphQLHasError(res, `Cannot query field "${invalid_field}" on type "${node_type}".`);
});


Scenario('test graphQL filter by string attribute', async(I) => {
  // add all nodes
  await I.addNodes(I.getSheepdogRoot(), nodes_list);
  I.seeAllNodesAddSuccess(nodes_list);

  let test_node = first_node;
  let test_field = getFieldOfType(test_node.data, 'string');
  let filter_string = `${test_field}: "${test_node.data[test_field]}"`;
  let res = await I.makeGraphQLNodeQuery(test_node.data.type, test_node, filter_string);

  I.seeNumberOfGraphQLField(res, test_node.data.type, 1);

  await I.deleteNodes(I.getSheepdogRoot(), nodes_list);
});


Scenario('test graphQL filter by boolean attribute', async(I) => {
  // add all nodes
  await I.addNodes(I.getSheepdogRoot(), nodes_list);
  I.seeAllNodesAddSuccess(nodes_list);

  let test_node = first_node;
  let test_field = getFieldOfType(test_node.data, 'boolean');
  let filter_string = `${test_field}: ${test_node.data[test_field]}`;
  let res = await I.makeGraphQLNodeQuery(test_node.data.type, test_node, filter_string);

  I.seeNumberOfGraphQLField(res, test_node.data.type, 1);

  await I.deleteNodes(I.getSheepdogRoot(), nodes_list);
});


Scenario('test graphQL filter by integer attribute', async(I) => {
  // add all nodes
  await I.addNodes(I.getSheepdogRoot(), nodes_list);
  I.seeAllNodesAddSuccess(nodes_list);

  let test_node = first_node;
  let test_field = getFieldOfType(test_node.data, 'number');
  let filter_string = `${test_field}: ${test_node.data[test_field]}`;
  let res = await I.makeGraphQLNodeQuery(test_node.data.type, test_node, filter_string);

  I.seeNumberOfGraphQLField(res, test_node.data.type, 1);

  await I.deleteNodes(I.getSheepdogRoot(), nodes_list);
});


Scenario('test graphQL count', async(I) => {
  // Count instances of each type
  let previous_counts = {};
  for (let type_name of Object.keys(nodes)) {
    previous_counts[type_name] = await I.graphQLCountType(type_name);
  }
  I.seeAllGraphQLPass(previous_counts);

  // add all nodes
  await I.addNodes(I.getSheepdogRoot(), nodes_list);
  I.seeAllNodesAddSuccess(nodes_list);

  // verify count has increased by 1 for all nodes
  let new_counts = {};
  for (let type_name of Object.keys(nodes)) {
    new_counts[type_name] = await I.graphQLCountType(type_name);
  }
  I.seeAllGraphQLNodeCountIncrease(previous_counts, new_counts);

  await I.deleteNodes(I.getSheepdogRoot(), nodes_list);
});


Scenario('test graphQL project id filter', async(I) => {
  // add the nodes
  await I.addNodes(I.getSheepdogRoot(), nodes_list);
  I.seeAllNodesAddSuccess(nodes_list);

  let results = {};
  let filter_string;
  for(let type_name of Object.keys(nodes)) {
    // filter by project id
    filter_string = `project_id: "${I.getProgramName()}-${I.getProjectName()}"`;
    results[type_name] = await I.makeGraphQLNodeQuery(type_name, nodes[type_name], filter_string);
  }
  I.seeAllGraphQLNodesEqual(nodes, results);

  // remove nodes
  await I.deleteNodes(I.getSheepdogRoot(), nodes_list);
  I.seeAllNodesDeleteSuccess(nodes_list);
});


Scenario('test graphQL with_path_to first to last node', async(I) => {
  // add all nodes
  await I.addNodes(I.getSheepdogRoot(), nodes_list);
  I.seeAllNodesAddSuccess(nodes_list);

  let start_node = first_node.data;
  let end_node = last_node.data;
  let q = `query Test {
    ${start_node.type} (
      order_by_desc: "created_datetime",
        with_path_to: {
            type: "${end_node.type}", submitter_id: "${end_node.submitter_id}"
        }
    ) {
      submitter_id
    }
  }`;

  let res = await I.makeGraphQLQuery(q, null);
  I.seeNumberOfGraphQLField(res, start_node.type, 1);

  await I.deleteNodes(I.getSheepdogRoot(), nodes_list);
  I.seeAllNodesDeleteSuccess(nodes_list);
});


Scenario('test graphQL path filter bad filter', async(I) => {
  await I.addNode(I.getSheepdogRoot(), first_node);
  I.seeNodeAddSuccess(first_node);

  // filter by a nonexistent project id
  let filter_string = `project_id: "NOT-EXISTS"`;
  let res = await I.makeGraphQLNodeQuery(first_node.data.type, first_node, filter_string);
  I.seeNumberOfGraphQLField(res, first_node.data.type, 0);

  // remove nodes
  await I.deleteNodes(I.getSheepdogRoot(), nodes_list);
});


Scenario('test graphQL with_path_to last to first node', async(I) => {
  // add all nodes
  await I.addNodes(I.getSheepdogRoot(), nodes_list);
  I.seeAllNodesAddSuccess(nodes_list);

  let start_node = last_node.data;
  let end_node = first_node.data;
  let q = `query Test {
    ${start_node.type} (
      order_by_desc: "created_datetime",
        with_path_to: {
            type: "${end_node.type}", submitter_id: "${end_node.submitter_id}"
        }
    ) {
      submitter_id
    }
  }`;

  let res = await I.makeGraphQLQuery(q, null);
  I.seeNumberOfGraphQLField(res, start_node.type, 1);

  await I.deleteNodes(I.getSheepdogRoot(), nodes_list);
  I.seeAllNodesDeleteSuccess(nodes_list);
});


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