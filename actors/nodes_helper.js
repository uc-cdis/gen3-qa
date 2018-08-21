

const fs = require('fs');
const path = require('path');

const data_path = process.env.TEST_DATA_PATH;

/**
 * Node object definition
 */
class Node {
  constructor(props) {
    // actual json data for node
    this.data = props.data;
    // position in submission order
    this.order = props.order;
    // node category (administrative, data_file, etc...)
    this.category = props.category;
    // node name (participant, read_group, submitted_unaligned_reads, etc...)
    this.name = props.name;
    // array of names for direct parent nodes
    this.target = props.target;
    // used for duplicating instances
    this.orig_props = props;
  }

  clone() {
    // deep clone the properties and create a new node
    return new Node(JSON.parse(JSON.stringify(this.orig_props)));
  }

  getFieldOfType(field_type) {
    // find a field of specified type in the node's data
    return Object.keys(this.data).find(key => typeof this.data[key] === field_type);
  }
}

const _getAllNodes = function () {
  // return an object of data nodes, keyed by node name
  try {
    const nodes = JSON.parse(fs.readFileSync(_getDataPathString('NodeDescriptions.json')));
    const nodes_dict = {};
    for (const node of nodes) {
      const node_name = node.NODE;
      nodes_dict[node_name] = new Node({
        data: JSON.parse(fs.readFileSync(_getDataPathString(`${node_name}.json`)))[0],
        order: node.ORDER,
        category: node.CATEGORY,
        name: node_name,
        target: node.TARGET,
      });
    }

    return nodes_dict;
  } catch (e) {
    console.log(e);
    throw new Error(`Unable to get node(s) from file(s): ${e.message}`);
  }
};

const _cloneNodes = function (original_nodes) {
  const new_nodes = {};
  Object.keys(original_nodes).forEach(name => new_nodes[name] = original_nodes[name].clone());
  return new_nodes;
};

const _getDataPathString = function (file_name) {
  // get full path to a file given the file name
  const path_obj = { dir: data_path, base: file_name };
  return path.format(path_obj);
};

const _nodePathToProject = function (start_node_name, all_nodes) {
  // BFS to find path to project from a starting node name
  // returns a dict containing nodes keyed by name
  const nodes_in_path = {};
  let que = [start_node_name];
  while (que.length > 0) {
    const s = que.pop();
    if (s === 'project') { break; }
    nodes_in_path[s] = all_nodes[s];
    que = all_nodes[s].target.concat(que);
  }
  return nodes_in_path;
};

const _pathWithFileNode = function (all_nodes) {
  // find a node that is a file then follow it to the root (project)
  // return an object which has the path to the file as well as the file itself
  const all_nodes_clone = _cloneNodes(all_nodes);
  const file_node_name = Object.keys(all_nodes_clone).find(node_name => all_nodes_clone[node_name].category === 'data_file');
  const nodes_path = _nodePathToProject(file_node_name, all_nodes_clone);
  const file = all_nodes_clone[file_node_name].clone();
  delete nodes_path[file_node_name];
  return {
    path: nodes_path,
    file,
  };
};


/**
 * Nodes helper
 */
// note that all_nodes should remain unmodified
const all_nodes = _getAllNodes();
let path_and_file = _pathWithFileNode(all_nodes);

module.exports = {

  all: all_nodes,

  allAsList: Object.values(all_nodes),

  pathWithFile: path_and_file,

  toFileAsList: Object.values(path_and_file.path),

  fileNode: path_and_file.file,

  get firstNode() {
    return this.ithNodeInPath(0);
  },

  get secondNode() {
    return this.ithNodeInPath(1);
  },

  get lastNode() {
    return this.ithNodeInPath(this.toFileAsList.length - 1);
  },

  ithNodeInPath(i) {
    // Return the ith node in the pathWithFile
    const nodes_list = Object.values(path_and_file.path);
    if (i > nodes_list.length || i < 0 || i === undefined) {
      throw new Error(`Node index out of range. Asked for ${i} but max index is ${nodes_list.length}.`);
    }
    return this.sortNodes(Object.values(all_nodes))[i];
  },

  sortNodes(nodes_list) {
    // given array of nodes, return them sorted
    return nodes_list.sort((a, b) => a.order - b.order);
  },

  refreshPathNodes() {
    // reload the path nodes (useful/necessary for clearing any changes to nodes that were made in tests)
    path_and_file = _pathWithFileNode(all_nodes);
    this.pathWithFile = path_and_file;
    this.toFileAsList = Object.values(path_and_file.path);
    this.fileNode = path_and_file.file;
  },

};
