const sheepdogQuestions = require('./sheepdogQuestions.js');
const sheepdogTasks = require('./sheepdogTasks.js');
const sheepdogProps = require('./sheepdogProps.js');
const peregrineActor = require('../peregrine/peregrineActor.js');
const usersHelper = require('../../usersHelper.js');

const I = actor();

const _deleteByIdRecursively = async id => {
  const delete_endpoint = `${sheepdogProps.endpoints.delete}/${id}`;
  const res = await I.sendDeleteRequest(
    delete_endpoint,
    usersHelper.mainAcct.accessTokenHeader,
  );

  if (!res.body.hasOwnProperty('dependent_ids')) {
    throw new Error(
      `Error deleting by ID recursively. Result missing 'dependent_ids' property: ${
        res.body
      }`,
    );
  }

  // deleted successfully
  if (res.body.code === 200 && res.body.dependent_ids === '') {
    return;
  }

  // need to delete dependent(s)
  if (res.body.code !== 200 && res.body.dependent_ids !== '') {
    const dependents = res.body.dependent_ids.split(',');
    await _deleteByIdRecursively(dependents[0]);
    await _deleteByIdRecursively(id);
  }
};

/**
 * Sheepdog sequences
 */
module.exports = {
  async addNode(node) {
    await sheepdogTasks.addNode(node);
    sheepdogQuestions.addNodeSuccess(node);
  },

  async deleteNode(node) {
    await sheepdogTasks.deleteNode(node);
    sheepdogQuestions.deleteNodeSuccess(node);
  },

  async updateNode(node) {
    await sheepdogTasks.addNode(node);
    sheepdogQuestions.updateNodeSuccess(node);
  },

  async addNodes(nodes_list) {
    await sheepdogTasks.addNodes(nodes_list);
    sheepdogQuestions.addNodesSuccess(nodes_list);
  },

  async deleteNodes(nodes_list) {
    await sheepdogTasks.deleteNodes(nodes_list);
    sheepdogQuestions.deleteNodesSuccess(nodes_list);
  },

  async findDeleteAllNodes() {
    // FIXME: This function doesn't always work and can be optimized
    // Delete all nodes in the program/project
    const top_node = 'project';
    const q = `
    {
      ${top_node} {
        _links {
          id
        }
      }
    }`;

    const res = await peregrineActor.do.query(q, null);
    try {
      while (res.data[top_node].length > 0) {
        const linked_type = res.data[top_node].pop();
        while (linked_type._links.length > 0) {
          const linked_type_instance = linked_type._links.pop();
          await _deleteByIdRecursively(linked_type_instance.id);
        }
      }
    } catch (e) {
      console.log(
        `Error finding and deleting nodes for project. \n  Error: ${
          e.message
        }\n  Query result: ${res}`,
      );
    }
  },
};
