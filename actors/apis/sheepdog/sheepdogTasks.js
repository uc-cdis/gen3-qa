const sheepdogProps = require('./sheepdogProps.js');
const nodesHelper = require('../../nodesHelper.js');
const usersHelper = require('../../usersHelper.js');

const I = actor();

/**
 * Internal Helpers
 */
const getIdFromResponse = function (res) {
  const body = res.body;
  try {
    return body.entities[0].id;
  } catch (e) {
    // return nothing
    return undefined;
  }
};

const getDidFromResponse = function (res) {
  try {
    const body = JSON.parse(res.body);
    return body[0].object_id;
  } catch (e) {
    // return nothing
    return undefined;
  }
};

const getDidFromFileId = function (fileNode) {
  // get did from sheepdog id
  if (fileNode.data.id === '' || fileNode.data.id === undefined) {
    return undefined;
  }
  const getFileEndpoint = `${sheepdogProps.endpoints.describe}?ids=${fileNode.data.id}&format=json`;
  return I.sendGetRequest(
    getFileEndpoint,
    usersHelper.mainAcct.accessTokenHeader,
  ).then((res) => {
    fileNode.did = getDidFromResponse(res);
  });
};

/**
 * Sheepdog Tasks
 */
module.exports = {
  async addNode(node) {
    // PUT to sheepdog
    return I.sendPutRequest(
      sheepdogProps.endpoints.add,
      JSON.stringify(node.data),
      usersHelper.mainAcct.accessTokenHeader,
    ).then((res) => {
      node.data.id = getIdFromResponse(res);
      node.add_res = res.body || {};
      if (node.category === 'data_file') {
        return getDidFromFileId(node);
      }
      return node;
    });
  },

  async deleteNode(node) {
    // DELETE to sheepdog
    const deleteEndpoint = `${sheepdogProps.endpoints.delete}/${node.data.id}`;
    return I.sendDeleteRequest(
      deleteEndpoint,
      usersHelper.mainAcct.accessTokenHeader,
    ).then((res) => {
      node.delete_res = res.body;
    });
  },

  async addNodes(nodesList) {
    // add nodes, in sorted key ascending order
    for (const node of nodesHelper.sortNodes(nodesList)) {
      await this.addNode(node);
    }
  },

  async deleteNodes(nodesList) {
    // remove nodes, in reverse sorted (descending key) order
    for (const node of nodesHelper.sortNodes(nodesList).reverse()) {
      await this.deleteNode(node);
    }
  },
};
