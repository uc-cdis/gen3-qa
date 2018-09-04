const sheepdogProps = require('./sheepdogProps.js');
const nodesHelper = require('../../nodesHelper.js');
const usersHelper = require('../../usersHelper.js');
const { Gen3Response } = require('../apiHelper');

const I = actor();

/**
 * Internal Helpers
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

function getDidFromResponse(res) {
  try {
    const body = JSON.parse(res.body);
    return body[0].object_id;
  } catch (e) {
    // return nothing
    return undefined;
  }
}

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
  async addNode(node, accessTokenHeader = usersHelper.mainAcct.accessTokenHeader) {
    // PUT to sheepdog
    return I.sendPutRequest(
      sheepdogProps.endpoints.add,
      JSON.stringify(node.data),
      accessTokenHeader || usersHelper.mainAcct.accessTokenHeader,
    ).then((res) => {
      node.data.id = getIdFromResponse(res);
      node.addRes = new Gen3Response(res);
      // node.add_res = res.body || {};
      if (node.category === 'data_file') {
        return getDidFromFileId(node, accessTokenHeader);
      }
      return node;
    });
  },

  async deleteNode(node, accessTokenHeader = usersHelper.mainAcct.accessTokenHeader) {
    // DELETE to sheepdog
    const deleteEndpoint = `${sheepdogProps.endpoints.delete}/${node.data.id}`;
    return I.sendDeleteRequest(
      deleteEndpoint,
      accessTokenHeader || usersHelper.mainAcct.accessTokenHeader,
    ).then((res) => {
      node.deleteRes = new Gen3Response(res);
    });
  },

  async addNodes(nodesList, accessTokenHeader = usersHelper.mainAcct.accessTokenHeader) {
    // add nodes, in sorted key ascending order
    for (const node of nodesHelper.sortNodes(nodesList)) {
      await this.addNode(node, accessTokenHeader);
    }
  },

  async deleteNodes(nodesList, accessTokenHeader = usersHelper.mainAcct.accessTokenHeader) {
    // remove nodes, in reverse sorted (descending key) order
    for (const node of nodesHelper.sortNodes(nodesList).reverse()) {
      await this.deleteNode(node, accessTokenHeader);
    }
  },
};
