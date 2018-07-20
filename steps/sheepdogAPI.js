'use strict';

let util = require('./utilSteps');
let accessTokenHeader = util.getAccessTokenHeader();

const program_name = util.getProgramName();
const project_name = util.getProjectName();


const revFromResponse = function(res) {
  try {
    return res.body.rev;
  } catch(e) {
    return "ERROR_GETTING_INDEXD"
  }
};


const didFromResponse = function(res) {
  try {
    let body = JSON.parse(res.body);
    return body[0].object_id;
  } catch(e) {
    return "ERROR_GETTING_SHEEPDOG"
  }
};


const idFromResponse = function(res) {
  let body = res.body;
  try {
    return body.entities[0].id;
  } catch(e) {
    return "ERROR_ADDING_NODE";
  }
};


module.exports.getIndexdFile = async function(index_endpoint, file) {
  // get data from indexd
  return this.sendGetRequest(`${index_endpoint}${file.did}`, accessTokenHeader).then(
    (res) => {
      file.rev = revFromResponse(res);
      return res.body;
    }
  )
};


module.exports.didFromFileId = async function(endpoint, file) {
  // get did from sheepdog id
  let get_file_endpoint = `${endpoint}${program_name}/${project_name}/export?ids=${file.data.id}&format=json`;

  return this.sendGetRequest(get_file_endpoint, accessTokenHeader).then(
    (res) => {
      file.did = didFromResponse(res);
    })
};


module.exports.submitFile = async function(endpoint, file) {
  return this.addNode(endpoint, file).then(
    () => {
      return this.didFromFileId(endpoint, file)
    });
};


module.exports.addNode = async function(endpoint, node) {
  // PUT to sheepdog
  return this.sendPutRequest(
    `${endpoint}${program_name}/${project_name}/`, JSON.stringify(node.data), accessTokenHeader)
    .then( (res) => {
      node.data.id = idFromResponse(res); // res.statusCode === 200 ? res.body.entities[0].id : "ERROR_ADDING_NODE";
      node.add_res = res.body;
    })
};


module.exports.addNodes = async function(endpoint, nodes) {
  // add nodes, in sorted key ascending order
  for (let node of nodes.sort((a, b) => {return a.key - b.key})) {
    await this.addNode(endpoint, node);
  }
};


module.exports.deleteNode = async function(endpoint, node) {
  // DELETE to sheepdog
  let delete_endpoint = `${endpoint}${program_name}/${project_name}/entities/${node.data.id}`;
  return this.sendDeleteRequest(delete_endpoint, accessTokenHeader)
    .then( (res) => {
      node.delete_res = res.body
    });
};

module.exports.deleteNodes = async function(endpoint, nodes) {
  // remove nodes, in reverse sorted (descending key) order
  for (let node of nodes.sort((a, b) => {return b.key - a.key})) {
    await this.deleteNode(endpoint, node);
  }
};


module.exports.deleteByIdRecursively = async function(endpoint, id) {
  let delete_endpoint = `${endpoint}${program_name}/${project_name}/entities/${id}`;
  let res = await this.sendDeleteRequest(delete_endpoint, accessTokenHeader);

  if (!res.body.hasOwnProperty('dependent_ids')) {
    throw new Error("Error deleting by ID recursively...");
  }

  // deleted successfully
  if (res.body.code === 200 && res.body.dependent_ids === "")
    return;

  // need to delete dependent(s)
  if (res.body.code !== 200 && res.body.dependent_ids !== "") {
    let dependents = res.body.dependent_ids.split(",");
    await this.deleteByIdRecursively(endpoint, dependents[0]);
    await this.deleteByIdRecursively(endpoint, id);
  }
};


module.exports.findDeleteAllNodes = async function() {
  // Delete all nodes in the program/project

  let top_node = 'experiment';
  let q = `
  {
    ${top_node} (project_id: "${program_name}-${project_name}") {
      id
    }
  }`;

  let res = await this.makeGraphQLQuery(q, null);
  while (res.data[top_node].length > 0) {
    await this.deleteByIdRecursively(this.getSheepdogRoot(), res.data[top_node][0].id);
    res = await this.makeGraphQLQuery(q, null);
  }
};