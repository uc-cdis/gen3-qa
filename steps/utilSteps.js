'use strict';

<<<<<<< feat/graphqlQuery
let username = process.env.INDEX_USERNAME;
let password = process.env.INDEX_PASSWORD;
let indexAuth = Buffer.from(`${username}:${password}`).toString('base64');


module.exports.getAccessTokenHeader = function() {
  return {
    'Accept': 'application/json',
    'Authorization': `bearer ${process.env.ACCESS_TOKEN}`
  };
};


module.exports.getIndexAuthHeader = function() {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json; charset=UTF-8',
    'Authorization': `Basic ${indexAuth}`
  };
};


module.exports.getProgramName = function() {
  return process.env.HOSTNAME.startsWith('qa') ? 'QA' : 'DEV';
};


module.exports.getProjectName = function() {
  return 'test';
};


module.exports.getIndexdRoot = function() {
  return "/index/index/"
};


module.exports.getSheepdogRoot = function() {
  return "/api/v0/submission/"
};

module.exports.sortByKey = function(obj_list) {
  obj_list.sort((a, b) => {return a.key - b.key})
};
=======
const fs = require('fs');

const data_path = process.env.TEST_DATA_PATH;


const nodePathToProject = function(start_node_name, all_nodes) {
  let nodes_in_path = {};
  let current_node_name = start_node_name;
  while (current_node_name !== 'project') {
    nodes_in_path[current_node_name] = all_nodes[current_node_name];
    current_node_name = all_nodes[current_node_name].target
  }
  return nodes_in_path
};


module.exports.getAllNodes = function() {
  // return an object of data nodes, keyed by node name
  try {
    let nodes = JSON.parse(fs.readFileSync(data_path + 'NodeDescriptions.json'));
    let nodes_dict = {};
    for (let node of nodes) {
      let node_data = JSON.parse(fs.readFileSync(`${data_path}${node.NODE}.json`));
      let node_name = node.NODE;
      let node_order = node.ORDER;
      let node_category = node.CATEGORY;
      let node_target = node.TARGET;

      nodes_dict[node_name] = {
        'data': node_data,
        'order': node_order,
        'category': node_category,
        'name': node_name,
        'target': node_target
      };
    }

    return nodes_dict;
  }
  catch(e) {
    console.log(e);
    throw new Error("Unable to get node(s) from file(s): " + e.message)
  }
};


module.exports.getNodePathToFile = function() {
  // find a node that is a file then follow it to the root (project)
  let all_nodes = this.getAllNodes();
  let file_node = Object.values(all_nodes).find((node) => { return node.category === 'data_file' });
  if (file_node === undefined)
    throw new Error('Unable to find a data_file node.');

  return nodePathToProject(file_node.name, all_nodes);
};


module.exports.sortNodes = function(node_list) {
  return node_list.sort((a, b) => { return a.order - b.order })
};
>>>>>>> master
