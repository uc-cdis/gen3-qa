let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let expect = chai.expect;


Feature('GraphQLQueries');

// Nodes, sorted hierarchically by key
let nodes = require("../../sample_data/submitSamples.json");


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


Scenario('test graphQL alias', async(I) => {
  await I.addNode("/api/v0/submission/", nodes.case);

  q = `query Test { alias1: case { id } }`;
  let res = await I.gqlQuery(q, null);
  expect(res.data).to.have.property("alias1");

  await I.deleteNode("/api/v0/submission/", nodes.case);
});

Scenario('test graphQL fields', async(I) => {
  // add all nodes
  await I.addNodes("/api/v0/submission/", Object.values(nodes));

  // verify each node has correct fields
  let filter_string;
  for(let type_name of Object.keys(nodes)) {
    filter_string = `submitter_id: "${nodes[type_name].data.submitter_id}"`;
    let node_exists = await I.gqlNodeExists(type_name, nodes[type_name], filter_string);
    expect(node_exists).to.equal(true);
  }

  // remove nodes
  await I.deleteNodes("/api/v0/submission/", Object.values(nodes));
});


Scenario('test graphQL invalid field', async(I) => {
  let invalid_field = "abcdefg";
  let node_type = "study";
  let q = `{
    ${node_type} {
      ${invalid_field}
    }
  }`;

  let res = await I.gqlQuery(q, null);
  expect(res.errors[0]).to.equal(`Cannot query field "${invalid_field}" on type "${node_type}".`);
});


Scenario('test graphQL count', async(I) => {
  // Count instances of each type
  let prev_count = {};
  for (let type_name of Object.keys(nodes)) {
    prev_count[type_name] = await I.gqlCountType(type_name);
  }

  // add all nodes
  await I.addNodes("/api/v0/submission/", Object.values(nodes));

  // verify count has increased by 1 for all nodes
  for (let type_name of Object.keys(nodes)) {
    let new_count = await I.gqlCountType(type_name);
    expect(new_count).to.equal(prev_count[type_name] + 1);
  }

  await I.deleteNodes("/api/v0/submission/", Object.values(nodes));
});


Scenario('test graphQL path filter', async(I) => {
  // add the nodes
  await I.addNodes("/api/v0/submission/", Object.values(nodes));

  let filter_string;
  for(let type_name of Object.keys(nodes)) {
    // filter by project id
    filter_string = `project_id: "${nodes[type_name].program}-${nodes[type_name].project}"`;
    let node_exists = await I.gqlNodeExists(type_name, nodes[type_name], filter_string);
    expect(node_exists).to.equal(true);
  }

  // remove nodes
  await I.deleteNodes("/api/v0/submission/", Object.values(nodes));
});


Scenario('test graphQL with_path_to', async(I) => {
  await I.addNodes("/api/v0/submission/", Object.values(nodes));

  let test_node = nodes.read_group.data;

  let q = `query Test {
      case (
              order_by_desc: "created_datetime",
              with_path_to: {
                  type: "${test_node.type}", submitter_id: "${test_node.submitter_id}"
              }
          ) {
          submitter_id
      }
  }`;

  let res = await I.gqlQuery(q, null);
  expect(res.data.case.length).to.equal(1);
  expect(res.data.case[0].submitter_id).to.equal(nodes.case.data.submitter_id);

  await I.deleteNodes("/api/v0/submission/", Object.values(nodes));
});


Scenario('test graphQL path filter bad filter', async(I) => {
  // add the nodes
  await I.addNodes("/api/v0/submission/", Object.values(nodes));

  let filter_string;
  for(let type_name of Object.keys(nodes)) {
    // filter by a nonexistent project id
    filter_string = `project_id: "NOT-EXISTS"`;
    let node_exists = await I.gqlNodeExists(type_name, nodes[type_name], filter_string);
    expect(node_exists).to.equal(false);
  }

  // remove nodes
  await I.deleteNodes("/api/v0/submission/", Object.values(nodes));
});


Scenario('test graphQL path filter no data', async(I) => {
  // don't add nodes and query
  let filter_string;
  for(let type_name of Object.keys(nodes)) {
    // filter by project id
    filter_string = `project_id: "${nodes[type_name].program}-${nodes[type_name].project}"`;
    let node_exists = await I.gqlNodeExists(type_name, nodes[type_name], filter_string);
    expect(node_exists).to.equal(false);
  }
});