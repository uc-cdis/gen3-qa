const sheepdogQuestions = require('./sheepdogQuestions.js');
const sheepdogTasks = require('./sheepdogTasks.js');
const sheepdogProps = require('./sheepdogProps.js');
const peregrineService = require('../peregrine/peregrineService.js');
const usersUtil = require('../../../utils/usersUtil.js');

const I = actor();

const deleteByIdRecursively = async function (id) {
  const deleteEndpoint = `${sheepdogProps.endpoints.delete}/${id}`;
  const res = await I.sendDeleteRequest(
    deleteEndpoint,
    usersUtil.mainAcct.accessTokenHeader,
  );

  if (!('dependent_ids' in res.body)) {
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
    await deleteByIdRecursively(dependents[0]);
    await deleteByIdRecursively(id);
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

  async addNodes(nodesList) {
    await sheepdogTasks.addNodes(nodesList);
    sheepdogQuestions.addNodesSuccess(nodesList);
  },

  async deleteNodes(nodesList) {
    await sheepdogTasks.deleteNodes(nodesList);
    sheepdogQuestions.deleteNodesSuccess(nodesList);
  },

  async findDeleteAllNodes() {
    // FIXME: This function doesn't always work and can be optimized
    // Delete all nodes in the program/project
    const topNode = 'project';
    const q = `
    {
      ${topNode} {
        _links {
          id
        }
      }
    }`;

    const res = await peregrineService.do.query(q, null);
    try {
      while (res.data[topNode].length > 0) {
        const linkedType = res.data[topNode].pop();
        /*eslint-disable */
        while (linkedType._links.length > 0) {
          const linkedTypeInstance = linkedType._links.pop();
          await deleteByIdRecursively(linkedTypeInstance.id);
        }
        /*eslint-disable */
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
