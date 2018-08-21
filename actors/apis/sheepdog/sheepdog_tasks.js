

const sheepdog_props = require('./sheepdog_props.js');
const nodes_helper = require('../../nodes_helper.js');
const commons_helper = require('../../commons_helper.js');

const I = actor();

/**
 * Internal Helpers
 */
const _seeNodePass = (res) => {
  expect(res).to.have.property('success', true);
  expect(res).to.have.property('entity_error_count', 0);
  expect(res).to.have.property('transactional_error_count', 0);
};

const _getIdFromResponse = (res) => {
  const body = res.body;
  try {
    return body.entities[0].id;
  } catch (e) {
    // return nothing
    return undefined;
  }
};

const _getDidFromResponse = (res) => {
  try {
    const body = JSON.parse(res.body);
    return body[0].object_id;
  } catch (e) {
    // return nothing
    return undefined;
  }
};

const _getDidFromFileId = (file_node) => {
  // get did from sheepdog id
  if (file_node.data.id === '' || file_node.data.id === undefined) { return; }
  const get_file_endpoint = `${sheepdog_props.endpoints.describe}?ids=${file_node.data.id}&format=json`;
  return I.sendGetRequest(get_file_endpoint, commons_helper.validAccessTokenHeader).then(
    (res) => {
      file_node.did = _getDidFromResponse(res);
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
      JSON.stringify(node.data), commons_helper.validAccessTokenHeader)
      .then((res) => {
        node.data.id = _getIdFromResponse(res);
        node.add_res = res.body || {};
        if (node.category === 'data_file') { return _getDidFromFileId(node); }
        return node;
      });
  },

  async deleteNode(node) {
    // DELETE to sheepdog
    const delete_endpoint = `${sheepdog_props.endpoints.delete}/${node.data.id}`;
    return I.sendDeleteRequest(delete_endpoint, commons_helper.validAccessTokenHeader)
      .then((res) => {
        node.delete_res = res.body;
      });
  },

  async addNodes(nodes_list) {
    // add nodes, in sorted key ascending order
    for (const node of nodes_helper.sortNodes(nodes_list)) {
      await this.addNode(node);
    }
  },

  async deleteNodes(nodes_list) {
    // remove nodes, in reverse sorted (descending key) order
    for (const node of nodes_helper.sortNodes(nodes_list).reverse()) {
      await this.deleteNode(node);
    }
  },
};
