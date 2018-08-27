const fs = require('fs');
const path = require('path');

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

  getFieldOfType(fieldType) {
    // find a field of specified type in the node's data
    return Object.keys(this.data).find(
      key => typeof this.data[key] === fieldType, // eslint-disable-line valid-typeof
    );
  }
}

/**
 * Nodes helper internal functions
 */
const DATA_PATH = process.env.TEST_DATA_PATH;

const getDataPathString = function (fileName) {
  // get full path to a file given the file name
  const pathObj = { dir: DATA_PATH, base: fileName };
  return path.format(pathObj);
};

const getAllNodes = function () {
  // return an object of data nodes, keyed by node name
  try {
    const nodes = JSON.parse(
      fs.readFileSync(getDataPathString('NodeDescriptions.json')),
    );
    const nodesDict = {};
    for (const node of nodes) {
      const nodeName = node.NODE;
      nodesDict[nodeName] = new Node({
        data: JSON.parse(
          fs.readFileSync(getDataPathString(`${nodeName}.json`)),
        )[0],
        order: node.ORDER,
        category: node.CATEGORY,
        name: nodeName,
        target: node.TARGET,
      });
    }

    return nodesDict;
  } catch (e) {
    console.log(e);
    throw new Error(`Unable to get node(s) from file(s): ${e.message}`);
  }
};

const cloneNodes = function (originalNodes) {
  const newNodes = {};
  Object.keys(originalNodes).forEach(
    (name) => {
      newNodes[name] = originalNodes[name].clone();
    },
  );
  return newNodes;
};

const nodePathToProject = function (startNodeName, allNodes) {
  // BFS to find path to project from a starting node name
  // returns a dict containing nodes keyed by name
  const nodesInPath = {};
  let que = [startNodeName];
  while (que.length > 0) {
    const s = que.pop();
    if (s === 'project') {
      break;
    }
    nodesInPath[s] = allNodes[s];
    que = allNodes[s].target.concat(que);
  }
  return nodesInPath;
};

const getPathWithFileNode = function (allNodes) {
  // find a node that is a file then follow it to the root (project)
  // return an object which has the path to the file as well as the file itself
  const allNodesClone = cloneNodes(allNodes);
  const fileNodeName = Object.keys(allNodesClone).find(
    nodeName => allNodesClone[nodeName].category === 'data_file',
  );
  const nodesPath = nodePathToProject(fileNodeName, allNodesClone);
  const file = allNodesClone[fileNodeName].clone();
  delete nodesPath[fileNodeName];
  return {
    path: nodesPath,
    file,
  };
};

/**
 * Nodes helper
 */
const dataMissingError = 'TEST_DATA_PATH env var missing - must set as path to test data to use nodes module';
// !!allNodes should remain unmodified to allow reloading data nodes without reading files!!
const canUseNodes = (DATA_PATH !== '' && DATA_PATH !== undefined);
let allNodes;
let pathAndFile;
if (canUseNodes) {
  allNodes = getAllNodes();
  pathAndFile = getPathWithFileNode(allNodes);
}

module.exports = {
  // Note that all function calls must verify we have data nodes to use
  // This is unfortunately the only way to allow Scenarios to use the module
  //   and read and process the node files only once.
  getPathWithFile() {
    if (!canUseNodes) {
      throw Error(dataMissingError);
    }
    return pathAndFile;
  },

  getPathToFile() {
    if (!canUseNodes) {
      throw Error(dataMissingError);
    }
    return Object.values(pathAndFile.path);
  },

  getFileNode() {
    if (!canUseNodes) {
      throw Error(dataMissingError);
    }
    return pathAndFile.file;
  },

  getFirstNode() {
    return this.ithNodeInPath(0);
  },

  getSecondNode() {
    return this.ithNodeInPath(1);
  },

  getLastNode() {
    return this.ithNodeInPath(this.toFileAsList.length - 1);
  },

  ithNodeInPath(i) {
    if (!canUseNodes) {
      throw Error(dataMissingError);
    }
    // Return the ith node in the pathWithFile
    const nodesList = Object.values(pathAndFile.path);
    if (i > nodesList.length || i < 0 || i === undefined) {
      throw new Error(
        `Node index out of range. Asked for ${i} but max index is ${nodesList.length}.`,
      );
    }
    return this.sortNodes(Object.values(allNodes))[i];
  },

  sortNodes(nodesList) {
    // given array of nodes, return them sorted
    if (!canUseNodes) {
      throw Error(dataMissingError);
    }
    return nodesList.sort((a, b) => a.order - b.order);
  },

  refreshPathNodes() {
    if (!canUseNodes) {
      throw Error(dataMissingError);
    }
    // reload the path nodes (necessary for clearing any changes to nodes that were made in tests)
    pathAndFile = getPathWithFileNode(allNodes);
    this.pathWithFile = pathAndFile;
    this.toFileAsList = Object.values(pathAndFile.path);
    this.fileNode = pathAndFile.file;
  },
};
