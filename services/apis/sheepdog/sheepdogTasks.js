const sheepdogProps = require('./sheepdogProps.js');
const nodes = require('../../../utils/nodes.js');
const user = require('../../../utils/user.js');
const { Gen3Response } = require('../../../utils/apiUtil');

const I = actor();

/**
 * Internal Utils
 */

/**
 * Gets Id from a sheepdog PUT response
 * @param res
 * @returns {*}
 */
function getIdFromResponse(res) {
  const body = res.body;
  try {
    return body.entities[0].id;
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
    const body = JSON.parse(res.body);
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
      JSON.stringify(node.data),
      accessTokenHeader || user.mainAcct.accessTokenHeader,
    ).then((res) => {
      node.data.id = getIdFromResponse(res);
      node.addRes = new Gen3Response(res);
      if (node.category === 'data_file') {
        return getDidFromFileId(node, accessTokenHeader);
      }
      return node;
    });
  },

  /**
   * Hits sheepdogs DELETE endpoint for a node
   * Adds response to node
   * @param {Node} node - Node to delete
   * @param accessTokenHeader
   * @returns {Promise<Gen3Response>}
   */
  async deleteNode(node, accessTokenHeader = user.mainAcct.accessTokenHeader) {
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
};
