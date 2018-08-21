const sheepdog_props = require('./sheepdog_props.js');
const nodes_helper = require('../../nodes_helper.js');
const commons_helper = require('../../commons_helper.js');

const I = actor();

/**
 * Internal Helpers
 */
const getIdFromResponse = (res) => {
  const body = res.body;
  try {
    return body.entities[0].id;
  } catch (e) {
    // return nothing
    return undefined;
  }
};

const getDidFromResponse = (res) => {
  try {
    const body = JSON.parse(res.body);
    return body[0].object_id;
  } catch (e) {
    // return nothing
    return undefined;
  }
};

const getDidFromFileId = (fileNode) => {
  // get did from sheepdog id
  if (fileNode.data.id === '' || fileNode.data.id === undefined) {
    return;
  }
  const getFileEndpoint = `${sheepdog_props.endpoints.describe}?ids=${fileNode.data.id}&format=json`;
  return I.sendGetRequest(
    getFileEndpoint,
    commons_helper.validAccessTokenHeader,
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
      sheepdog_props.endpoints.add,
      JSON.stringify(node.data),
      commons_helper.validAccessTokenHeader,
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
    const deleteEndpoint = `${sheepdog_props.endpoints.delete}/${node.data.id}`;
    return I.sendDeleteRequest(
      deleteEndpoint,
      commons_helper.validAccessTokenHeader,
    ).then((res) => {
      node.delete_res = res.body;
    });
  },

  async addNodes(nodesList) {
    // add nodes, in sorted key ascending order
    for (const node of nodes_helper.sortNodes(nodesList)) {
      await this.addNode(node);
    }
  },

  async deleteNodes(nodesList) {
    // remove nodes, in reverse sorted (descending key) order
    for (const node of nodes_helper.sortNodes(nodesList).reverse()) {
      await this.deleteNode(node);
    }
  },
};
