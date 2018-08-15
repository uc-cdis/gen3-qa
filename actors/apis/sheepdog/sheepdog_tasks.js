const sheepdog_props = require('./sheepdog_props.js');
const generic_actor = require('../generic_actor.js');
let I = actor();

/**
 * Internal Helpers
 */
const _seeNodePass = (res) => {
  expect(res).to.have.property('success', true);
  expect(res).to.have.property('entity_error_count', 0);
  expect(res).to.have.property('transactional_error_count', 0);
};

const _getIdFromResponse = (res) => {
  let body = res.body;
  try {
    return body.entities[0].id;
  } catch (e) {
    // return nothing
  }
};

const _getDidFromResponse = (res) => {
  try {
    let body = JSON.parse(res.body);
    return body[0].object_id;
  } catch(e) {
    // return nothing
  }
};

const _getDidFromFileId = (file_node) => {
  // get did from sheepdog id
  if (file_node.data.id === '' || file_node.data.id === undefined)
    return;
  let get_file_endpoint = `${sheepdog_props.endpoints.describe}?ids=${file_node.data.id}&format=json`;
  return I.sendGetRequest(get_file_endpoint, sheepdog_props.validAccessTokenHeader).then(
    (res) => {
      file_node.did = _getDidFromResponse(res);
    })
};

const _deleteByIdRecursively = async (id) => {
  let delete_endpoint = `${sheepdog_props.endpoints.delete}/${id}`;
  let res = await I.sendDeleteRequest(delete_endpoint, sheepdog_props.validAccessTokenHeader);

  if (!res.body.hasOwnProperty('dependent_ids')) {
    throw new Error("Error deleting by ID recursively. Result missing 'dependent_ids' property: " + res.body);
  }

  // deleted successfully
  if (res.body.code === 200 && res.body.dependent_ids === "")
    return;

  // need to delete dependent(s)
  if (res.body.code !== 200 && res.body.dependent_ids !== "") {
    let dependents = res.body.dependent_ids.split(",");
    await this.deleteByIdRecursively(dependents[0]);
    await this.deleteByIdRecursively(id);
  }
};

/**
 * Sheepdog Tasks
 */
module.exports = {
  async addNode (node) {
    // PUT to sheepdog
    return I.sendPutRequest(
      sheepdog_props.endpoints.add, JSON.stringify(node.data), sheepdog_props.validAccessTokenHeader)
      .then( (res) => {
        node.data.id = _getIdFromResponse(res);
        node.add_res = res.body || {};
        if (node.category === 'data_file')
          return _getDidFromFileId(node)
      })
  },

  async deleteNode (node) {
    // DELETE to sheepdog
    let delete_endpoint = `${sheepdog_props.endpoints.delete}/${node.data.id}`;
    return I.sendDeleteRequest(delete_endpoint, sheepdog_props.validAccessTokenHeader)
      .then( (res) => {
        node.delete_res = res.body
      });
  },

  async addNodes (nodes_list) {
    // add nodes, in sorted key ascending order
    for (let node of generic_actor.do.sortNodes(nodes_list)) {
      await this.addNode(node);
    }
  },

  async deleteNodes (nodes_list) {
    // remove nodes, in reverse sorted (descending key) order
    for (let node of generic_actor.do.sortNodes(nodes_list).reverse()) {
      await this.deleteNode(node);
    }
  },

  async findDeleteAllNodes () {
    // FIXME: This function doesn't always work and can be optimized
    // Delete all nodes in the program/project
    let top_node = 'project';
    let q = `
    {
      ${top_node} {
        _links {
          id
        }
      }
    }`;

    let res = await this.makeGraphQLQuery(q, null);
    try {
      while (res.data[top_node].length > 0) {
        let linked_type = res.data[top_node].pop();
        while (linked_type._links.length > 0) {
          let linked_type_instance = linked_type._links.pop();
          await _deleteByIdRecursively(linked_type_instance.id);
        }
      }
    } catch(e) {
      console.log("Error finding and deleting nodes for project. \n  Error: " + e.message + "\n  Query result: " + res)
    }
  }
};