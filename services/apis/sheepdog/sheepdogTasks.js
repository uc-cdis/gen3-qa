const sheepdogProps = require('./sheepdogProps.js');
const nodesUtil = require('../../../utils/nodesUtil.js');
const usersUtil = require('../../../utils/usersUtil.js');
const { Gen3Response } = require('../../../utils/apiUtil');

const I = actor();

/**
 * Internal Utils
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
  async addNode(node, accessTokenHeader = usersUtil.mainAcct.accessTokenHeader) {
    // PUT to sheepdog
    return I.sendPutRequest(
      sheepdogProps.endpoints.add,
      JSON.stringify(node.data),
      accessTokenHeader || usersUtil.mainAcct.accessTokenHeader,
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

  async deleteNode(node, accessTokenHeader = usersUtil.mainAcct.accessTokenHeader) {
    // DELETE to sheepdog
    const deleteEndpoint = `${sheepdogProps.endpoints.delete}/${node.data.id}`;
    return I.sendDeleteRequest(
      deleteEndpoint,
      accessTokenHeader || usersUtil.mainAcct.accessTokenHeader,
    ).then((res) => {
      node.deleteRes = new Gen3Response(res);
    });
  },

  async addNodes(nodesList, accessTokenHeader = usersUtil.mainAcct.accessTokenHeader) {
    // add nodes, in sorted key ascending order
    for (const node of nodesUtil.sortNodes(nodesList)) {
      await this.addNode(node, accessTokenHeader);
    }
  },

  async deleteNodes(nodesList, accessTokenHeader = usersUtil.mainAcct.accessTokenHeader) {
    // remove nodes, in reverse sorted (descending key) order
    for (const node of nodesUtil.sortNodes(nodesList).reverse()) {
      await this.deleteNode(node, accessTokenHeader);
    }
  },
};
