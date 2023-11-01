const sheepdogProps = require('./sheepdogProps.js');
const nodes = require('../../../utils/nodes.js');
const user = require('../../../utils/user.js');
const { Gen3Response } = require('../../../utils/apiUtil');
const { Bash } = require('../../../utils/bash.js');

const I = actor();
const bash = new Bash();

/**
 * Internal Utils
 */

/**
 * Gets Id from a sheepdog PUT response
 * @param res
 * @returns {*}
 */
function getIdFromResponse(res) {
  const { data } = res;
  try {
    return data.entities[0].id;
  } catch (e) {
    // return nothing
    return undefined;
  }
}

/**
 * Gets did from a sheepdog GET response
 * @param res
 * @returns {*}
 */
function getDidFromResponse(res) {
  try {
    const body = (typeof res.data === 'string') ? JSON.parse(res.data) : res.data;
    return body[0].object_id;
  } catch (e) {
    // return nothing
    return undefined;
  }
}

/**
 * Fetches file did given sheepdog node id
 * @param {Node} fileNode
 * @param {Object} accessTokenHeader
 * @returns {*}
 */
function getDidFromFileId(fileNode, accessTokenHeader) {
  // get did from sheepdog id
  if (fileNode.data.id === '' || fileNode.data.id === undefined) {
    return undefined;
  }
  const getFileEndpoint = `${sheepdogProps.endpoints.describe}?ids=${fileNode.data.id}&format=json`;
  return I.sendGetRequest(
    getFileEndpoint,
    accessTokenHeader,
  ).then((res) => {
    fileNode.did = getDidFromResponse(res);
  });
}

/**
 * Sheepdog Tasks
 */
module.exports = {
  /**
   * PUTs to sheepdog submit endpoint adding some id properties along the way
   * Adds response to node
   * @param {Node} node - node to submit
   * @param {Object} accessTokenHeader
   * @returns {Promise<Gen3Response>} - sheepdog submit response
   */
  async addNode(node, accessTokenHeader = user.mainAcct.accessTokenHeader) {
    // PUT to sheepdog
    return I.sendPutRequest(
      sheepdogProps.endpoints.add,
      node.data,
      accessTokenHeader || user.mainAcct.accessTokenHeader,
    ).then((res) => {
      node.addRes = new Gen3Response(res);
      node.data.id = getIdFromResponse(node.addRes);
      if (node.category && node.category.includes('_file') && [200, 201].includes(node.addRes.status)) {
        return getDidFromFileId(node, accessTokenHeader);
      }
      return node;
    });
  },

  /**
   * PUTs to sheepdog submit endpoint adding some id properties along the way
   * Adds response to node in chunks
   * @param {Node} node - node to submit
   * @param {Object} accessTokenHeader
   * @returns {Promise<Gen3Response>} - sheepdog submit response
   */
  async addNodeChunked(node, accessTokenHeader = user.mainAcct.accessTokenHeader) {
    let chunk = node.data.length;
    let index = 0;
    let submitData;
    let response;
    while (index < node.data.length) {
      submitData = node.data.slice(index, Math.min(index + chunk, node.data.length));
      response = await I.sendPutRequest(
        sheepdogProps.endpoints.add,
        submitData,
        accessTokenHeader || user.mainAcct.accessTokenHeader,
      );

      if (response.status === 413) {
        chunk /= 2;
        if (chunk === 0) break;
      } else {
        index += chunk;
      }
    }
    node.addRes = new Gen3Response(response);
    node.data.id = getIdFromResponse(node.addRes);
    return node;
  },

  /**
   * Hits sheepdogs DELETE endpoint for a node
   * Adds response to node
   * @param {Node} node - Node to delete
   * @param accessTokenHeader
   * @returns {Promise<Gen3Response>}
   */
  async deleteNode(node, accessTokenHeader = user.mainAcct.accessTokenHeader) {
    if (!node.data.id) {
      console.log('Cannot delete:', node);
      throw Error('Cannot delete node because `node.data.id` is missing');
    }
    const deleteEndpoint = `${sheepdogProps.endpoints.delete}/${node.data.id}`;
    return I.sendDeleteRequest(
      deleteEndpoint,
      accessTokenHeader || user.mainAcct.accessTokenHeader,
    ).then((res) => {
      node.deleteRes = new Gen3Response(res);
    });
  },

  /**
   * Submit an array of nodes to sheepdog
   * Adds responses to each node
   * @param {Node[]} nodesList - array of nodes to submit
   * @param accessTokenHeader
   * @returns {Promise<void>}
   */
  async addNodes(nodesList, accessTokenHeader = user.mainAcct.accessTokenHeader) {
    // add nodes, in sorted key ascending order
    for (const node of nodes.sortNodes(nodesList)) {
      await this.addNode(node, accessTokenHeader);
    }
  },

  /**
   * Deletes an array of nodes from sheepdog
   * @param {Node[]} nodesList - array of nodes to delete
   * @param accessTokenHeader
   * @returns {Promise<void>}
   */
  async deleteNodes(nodesList, accessTokenHeader = user.mainAcct.accessTokenHeader) {
    // remove nodes, in reverse sorted (descending key) order
    for (const node of nodes.sortNodes(nodesList).reverse()) {
      await this.deleteNode(node, accessTokenHeader);
    }
  },

  runGenTestData(maxSamples) {
    return bash.runJob('gentestdata',
      `TEST_PROGRAM jnkns TEST_PROJECT jenkins MAX_EXAMPLES ${maxSamples} SUBMISSION_USER cdis.autotest@gmail.com`);
  },
};
