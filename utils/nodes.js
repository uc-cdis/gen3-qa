/*eslint-disable */
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
   * @param {Object} props.orig_props - Copy of props for cloning node properties
   */
  constructor(props) {
    this.data = props.data;
    this.order = props.order;
    this.category = props.category;
    this.name = props.name;
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
      (key) => typeof this.data[key] === fieldType, // eslint-disable-line valid-typeof
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
  const lines = fs.readFileSync(
    getDataPathString('DataImportOrderPath.txt'), 'utf-8',
  ).split('\n').filter(Boolean);

  const nodesDict = {};
  try {
    let order = 1;
    for (const line of lines) {
      const parts = line.split('\t');
      const nodeName = parts[0];
      if (nodeName === 'project') continue; // project.json is not simulated
      nodesDict[nodeName] = new Node({
        data: JSON.parse(
          fs.readFileSync(getDataPathString(`${nodeName}.json`)),
        )[0],
        order,
        category: parts[1],
        name: nodeName,
      });
      order += 1;
    }
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
 * Finds a file node and gets a path to the project node
 * @param {Object} allNodes - Nodes keyed by node name
 * @returns {{path: Node[], file: Node}} - Path up to the node, and file node itself
 */
const getPathWithFileNode = function (allNodes) {
  // console.log(`allNodes --> ${JSON.stringify(allNodes)}`)
  const allNodesClone = cloneNodes(allNodes);
  const fileNodeName = Object.keys(allNodesClone).findLast(
    (nodeName) => allNodesClone[nodeName].category.includes('_file'),
  );
  const file = allNodesClone[fileNodeName].clone();
  delete allNodesClone[fileNodeName];
  // console.log(`allNodesClone --> ${JSON.stringify(allNodesClone)}`)
  return {
    path: allNodesClone,
    file,
  };
};

/**
 * Returns the node that has the specified submitter_id, or null if there isn't one.
 * @param {string} submitterId
 * @returns Node
 */
const getNodeWithSubmitterId = function (submitterId) {
  const nodeName = Object.keys(allNodes).find(
    (nodeName) => allNodes[nodeName].data.submitter_id == submitterId,
  );
  return allNodes[nodeName].clone();
};

/**
 * Recursively steps through nodes from bottom to top looking for links, and submit all linked nodes.
 *
 * @param {boolean} newSubmitterIds - false by default, submit the nodes as-is. If true, generate a new submitter ID
 * before submitting each linked node.
 */
const submitLinksForNode = async function (sheepdog, record, newSubmitterIds = false) {
  for (const prop in record.data) {
    // check if it's a link
    if (record.data[prop] && record.data[prop].hasOwnProperty('submitter_id')) {
      if (process.env.DEBUG === 'true') {
        console.log(`Submitting links: record '${record.data.submitter_id}' links to '${record.data[prop].submitter_id}'`);
      }
      // find the linked node
      const linkedNode = getNodeWithSubmitterId(record.data[prop].submitter_id);
      if (!linkedNode) {
        throw new Error(`Record has a link to '${record.data[prop].submitter_id}' but we can't find that record`);
      }
      // submit the linked node's own linked nodes
      await submitLinksForNode(sheepdog, linkedNode, newSubmitterIds);

      if (newSubmitterIds) { // generate a new submitter ID
        const rand = Math.random().toString(36).substring(2, 7); // 5 random chars
        const newId = `${linkedNode.data.type}_${rand}`;
        console.log(`Updating link from '${record.data[prop].submitter_id}' to new record '${newId}'`);
        linkedNode.data.submitter_id = newId; // `addNode` will create a new record since it's a new ID
        record.data[prop].submitter_id = newId; // update the link to reference the new node
      }

      // submit the linked node.
      // allow updates: this node may have been submitted before if it's a parent to several other nodes.
      await sheepdog.complete.addNode(linkedNode, true);
    }
  }
};

// IMPORTANT: treat allNodes as immutable after init; allows refreshing nodes without reading files
let allNodes;
let pathAndFile;

const localTestDataPresent = (DATA_PATH !== '' && DATA_PATH !== undefined && DATA_PATH !== '\'\'');

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
        return resolve(body);
      });
    });
  },
  

  async getNodeFromURL(dataUrl) {
    const fileContents = await module.exports.downloadFile(dataUrl);
    const nodeObj = JSON.parse(JSON.stringify(fileContents));
    const node = new Node({});
    node.data = nodeObj;
    node.orig_props = { data: nodeObj };
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
    return module.exports.ithNodeInPath(0);
  },

  /**
   * Returns the second node in path to a file node
   * @returns {Node}
   */
  getSecondNode() {
    return module.exports.ithNodeInPath(1);
  },

  /**
   * Returns the last node in path to file node (ie node before file node)
   * @returns {Node}
   */
  getLastNode() {
    return module.exports.ithNodeInPath(module.exports.toFileAsList.length - 1);
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
    return module.exports.sortNodes(Object.values(allNodes))[i];
  },

  getNode(nodeName) {
    return allNodes[nodeName];
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
    module.exports.pathWithFile = pathAndFile;
    module.exports.toFileAsList = Object.values(pathAndFile.path);
    module.exports.fileNode = pathAndFile.file;
  },

  async generateAndAddNode(sheepdog, nodeName) {
    console.log(`Generating a '${nodeName}' record`);
    const newSubmitterID = `${nodeName}-${Math.random().toString(36).substring(2, 7)}`;
    // start from the record generated by data-simulator to ensure all required props are there
    const metadata = module.exports.getNode(nodeName).clone();
    metadata.data.submitter_id = newSubmitterID;
    if (process.env.DEBUG === 'true') {
      console.log('Generated record, now submitting:', metadata);
    }
    await sheepdog.complete.addNode(metadata);
    return newSubmitterID;
  },

  /**
   * Creates a file record in sheepdog, linked to the specified indexd file.
   * Submits the file record and all its parent links.
   *
   * /!\ this function does not include a check for success or
   * failure of the file node's submission, to allow for negative tests
   *
   * @param {boolean} createNewParents - false by default, submit the nodes as-is. If true, generate a new node
   * with a new submitter IDs for each parent node.
   */
  async submitGraphAndFileMetadata(sheepdog, fileGuid = null, fileSize = null, fileMd5 = null, submitter_id = null, consent_codes = null, createNewParents = false) {
    // submit metadata with object id via sheepdog
    existingFileNode = module.exports.getFileNode()
    const metadata = existingFileNode.clone();

    if (fileGuid) {
      metadata.data.object_id = fileGuid;
    }
    if (fileSize) {
      metadata.data.file_size = fileSize;
    }
    if (fileMd5) {
      metadata.data.md5sum = fileMd5;
    }
    if (submitter_id) {
      metadata.data.submitter_id = submitter_id;
    }
    if (consent_codes) {
      // check that the dictionary has consent codes
      if (!metadata.data.consent_codes) {
        throw new Error('Tried to set consent_codes but consent_codes not in dictionary. Should test be disabled?');
      }
      metadata.data.consent_codes = consent_codes;
    }

    // submit all nodes that are directly or indirectly linked to this one
    await submitLinksForNode(sheepdog, metadata, createNewParents);

    // delete the existing file node and replace it with the newly generated one, to avoid conflicts if
    // any of the links do not allow linking multiple file nodes to the same parent node.
    // NOTE: instead of delete+submit, we could just replace the existing node by not overwriting `submitter_id`.
    if (existingFileNode.data.id) { // only delete if it has an id (meaning it has been submitted previously)
      // NOTE: currently this assumes the node has no child nodes (or that they haven't been submitted).
      // If it does, this will error.
      console.log(`${new Date()}: deleting old metadata node`);
      if (process.env.DEBUG === 'true') {
        console.log(`old metadata.data: ${JSON.stringify(existingFileNode.data)}`);
      }
      await sheepdog.complete.deleteNode(existingFileNode);
    }

    console.log(`${new Date()}: adding metadata node`);
    if (process.env.DEBUG === 'true') {
      console.log(`new metadata.data: ${JSON.stringify(metadata.data)}`);
    }
    await sheepdog.do.addNode(metadata); // submit, but don't check for success

    // the result of the submission is stored in metadata.addRes by addNode()
    return metadata;
  },
};
