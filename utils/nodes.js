/**
 * Util providing nodes (graph data) access from local files to submit, delete, sort, etc
 * @module nodesUtil
 */

const fs = require('fs');
const path = require('path');
const request = require('request');

// Path to the root directory where node data files are located
const DATA_PATH = process.env.TEST_DATA_PATH;

const dataMissingError = 'TEST_DATA_PATH env var missing - must set as path to test data to use nodes module';

/**
 * Class for a node data
 */
class Node {
  /**
   *
   * @param {Object} props - node properties
   * @param {Object} props.data - JSON object of node data
   * @param {number} props.order - Sort index
   * @param {string} props.category - Category of the node (e.g. file, clinical, administrative...)
   * @param {string[]} props.target - Array of names of nodes this node points to in graph
   * @param {Object} props.orig_props - Copy of props for cloning node properties
   */
  constructor(props) {
    this.data = props.data;
    this.order = props.order;
    this.category = props.category;
    this.name = props.name;
    this.target = props.target;
    this.orig_props = props;
  }

  /**
   * Deep clones the properties and returns a new node
   * @returns {Node}
   */
  clone() {
    return new Node(JSON.parse(JSON.stringify(this.orig_props)));
  }

  /**
   * Searches for a field in the node data
   * @param {string} fieldType
   * @returns {string | undefined}
   */
  getFieldOfType(fieldType) {
    // find a field of specified type in the node's data
    return Object.keys(this.data).find(
      key => typeof this.data[key] === fieldType, // eslint-disable-line valid-typeof
    );
  }
}

/**
 * Util for getting full path to data file
 * @param {string} fileName
 * @returns {string}
 */
const getDataPathString = function (fileName) {
  const pathObj = { dir: DATA_PATH, base: fileName };
  return path.format(pathObj);
};

/**
 * Loads all node data files and returns them as an object keyed by node name
 */
const getAllNodes = function () {
  var lines = fs.readFileSync(
    getDataPathString('DataImportOrderPath.txt'), 'utf-8'
  ).split('\n').filter(Boolean);

  const nodesDict = {};
  try {
    var order = 1;
    var target = 'project'; // first node (project) is related to program
    for (line of lines) {
      parts = line.split('\t');
      const nodeName = parts[0];
      if (nodeName == 'project') continue; // project.json is not simulated
      nodesDict[nodeName] = new Node({
        data: JSON.parse(
          fs.readFileSync(getDataPathString(`${nodeName}.json`)),
        )[0],
        order: order,
        category: parts[1],
        name: nodeName,
        target: target,
      });
      target = nodeName;
      order++;
    };
    return nodesDict;
    // console.log(nodesDict);
  } catch (e) {
    console.log(e);
    throw new Error(`Unable to get node(s) from file(s): ${e.message}`);
  }
};

/**
 * Deep clones all nodes
 * @param {Object} originalNodes - Nodes keyed by node name
 * @returns {Object}
 */
const cloneNodes = function (originalNodes) {
  const newNodes = {};
  Object.keys(originalNodes).forEach(
    (name) => {
      newNodes[name] = originalNodes[name].clone();
    },
  );
  return newNodes;
};

/**
 * Uses BFS to find a path to project node from given starting node
 * @param {string} startNodeName - node to start search from
 * @param {Object} allNodes - Nodes keyed by node name
 */
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

/**
 * Finds a file node and gets a path to the project node
 * @param {Object} allNodes - Nodes keyed by node name
 * @returns {{path: Node[], file: Node}} - Path up to the node, and file node itself
 */
const getPathWithFileNode = function (allNodes) {
  const allNodesClone = cloneNodes(allNodes);
  const fileNodeName = Object.keys(allNodesClone).find(
    nodeName => allNodesClone[nodeName].category === 'data_file',
  );
  const file = allNodesClone[fileNodeName].clone();
  delete allNodesClone[fileNodeName];
  return {
    path: allNodesClone,
    file,
  };
};

// IMPORTANT: treat allNodes as immutable after init; allows refreshing nodes without reading files
let allNodes;
let pathAndFile;

const localTestDataPresent = (DATA_PATH !== '' && DATA_PATH !== undefined && DATA_PATH !== "''");

// Check that the data path is defined and load the nodes
if (localTestDataPresent) {
  allNodes = getAllNodes();
  pathAndFile = getPathWithFileNode(allNodes);
}

module.exports = {
  allTheNodes() {
    return Object.values(allNodes);
  },

  downloadFile(url) {
    return new Promise((resolve, reject) => {
      request(url, { json: true }, (err, res, body) => {
        if (err) { return reject(err); }
        resolve(body);
      })
    });
  },

  getNodeFromURL: async function(dataUrl) {
    let fileContents = await this.downloadFile(dataUrl);
    let nodeObj = JSON.parse(JSON.stringify(fileContents));
    var node = new Node({});
    node.data = nodeObj;
    node.orig_props = {'data': nodeObj};
    return node;
  },

  /**
   * Get a file node and its path to the root node
   * @returns {{path: Node[], file: Node}}
   */
  getPathWithFile() {
    if (!localTestDataPresent) {
      throw Error(dataMissingError);
    }
    return pathAndFile;
  },

  /**
   * Returns a path from root node to a file node (not including file node)
   * @returns {Node[]}
   */
  getPathToFile() {
    if (!localTestDataPresent) {
      throw Error(dataMissingError);
    }
    return Object.values(pathAndFile.path);
  },

  /**
   * Returns a file node which corresponds to the path from getPathToFile
   * @returns {Node}
   */
  getFileNode() {
    if (!localTestDataPresent) {
      throw Error(dataMissingError);
    }
    return pathAndFile.file;
  },

  /**
   * Returns the first node in path to a file node
   * @returns {Node}
   */
  getFirstNode() {
    return this.ithNodeInPath(0);
  },

  /**
   * Returns the second node in path to a file node
   * @returns {Node}
   */
  getSecondNode() {
    return this.ithNodeInPath(1);
  },

  /**
   * Returns the last node in path to file node (ie node before file node)
   * @returns {Node}
   */
  getLastNode() {
    return this.ithNodeInPath(this.toFileAsList.length - 1);
  },

  /**
   * Returns the ith node in path to file node
   * @param i
   * @returns {Node}
   */
  ithNodeInPath(i) {
    if (!localTestDataPresent) {
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

  /**
   * Returns list of nodes sorted by submission order
   * @param {Node[]} nodesList
   * @returns {Node[]}
   */
  sortNodes(nodesList) {
    // given array of nodes, return them sorted
    if (!localTestDataPresent) {
      throw Error(dataMissingError);
    }
    return nodesList.sort((a, b) => a.order - b.order);
  },

  /**
   * Refreshes the path nodes used in other functions. Necessary when modifying nodes in tests
   */
  refreshPathNodes() {
    if (!localTestDataPresent) {
      throw Error(dataMissingError);
    }
    pathAndFile = getPathWithFileNode(allNodes);
    this.pathWithFile = pathAndFile;
    this.toFileAsList = Object.values(pathAndFile.path);
    this.fileNode = pathAndFile.file;
  },

  async generateAndAddCoremetadataNode(sheepdog) {
    const newSubmitterID = `submitter-${Math.random().toString(36).substring(2, 7)}`;
    const newCoremetadataNode = {
      data: {
        projects: {
            code: 'jenkins',
        },
        submitter_id: newSubmitterID,
        type: 'core_metadata_collection',
      },
    };
    await sheepdog.complete.addNode(newCoremetadataNode);
    return newSubmitterID;
  },

  /**
   * link metadata to an indexd file via sheepdog,
   * after submitting metadata for the parent nodes
   * /!\ this function does not include a check for success or
   * failure of the data_file node's submission
   */
  async submitGraphAndFileMetadata(sheepdog, nodes, fileGuid, fileSize, fileMd5, submitter_id=null, consent_codes=null) {
    // submit metadata with object id via sheepdog
    metadata = nodes.getFileNode().clone();
    metadata.data.object_id = fileGuid;
    metadata.data.file_size = fileSize;
    metadata.data.md5sum = fileMd5;
    if (submitter_id) {
      metadata.data.submitter_id = submitter_id;
    }
    if (consent_codes) {
        // check that the dictionary has consent codes
	if (!metadata.data.consent_codes) {
            throw "Tried to set consent_codes but consent_codes not in dictionary. Should test be disabled?"
        }
	metadata.data.consent_codes = consent_codes;
    }

    // assuming all data files can be submitted with a single link to a
    // core_metadata_collection: add it, and remove other links
    const cmcSubmitterID = await this.generateAndAddCoremetadataNode(sheepdog);
    for (var prop in metadata.data) {
      if (metadata.data.hasOwnProperty(prop) && metadata.data[prop].hasOwnProperty('submitter_id')) {
        delete metadata.data[prop];
      }
    }
    metadata.data.core_metadata_collections = {
      submitter_id: cmcSubmitterID
    };

    await sheepdog.do.addNode(metadata); // submit, but don't check for success

    // the result of the submission is stored in metadata.addRes by addNode()
    return metadata;
  },
};
