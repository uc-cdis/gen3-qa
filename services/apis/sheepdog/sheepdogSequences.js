const sheepdogQuestions = require('./sheepdogQuestions.js');
const sheepdogTasks = require('./sheepdogTasks.js');
const sheepdogProps = require('./sheepdogProps.js');
const peregrineService = require('../peregrine/peregrineService.js');
const user = require('../../../utils/user.js');

const I = actor();

// Note that 'dependent_ids' now only contains 1 ID for optimization reasons.
// So this function only works if there is only one entity for each node.
const deleteByIdRecursively = async function (id) {
  const deleteEndpoint = `${sheepdogProps.endpoints.delete}/${id}`;
  const res = await I.sendDeleteRequest(
    deleteEndpoint,
    user.mainAcct.accessTokenHeader,
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
  /**
   * Submits a node to sheepdog and asserts it was submitted successfully
   * @param {Node} node
   * @returns {Promise<void>}
   */
  async addNode(node) {
    await sheepdogTasks.addNode(node);
    sheepdogQuestions.addNodeSuccess(node);
  },

  /**
   * Deletes a node from sheepdog and asserts it was deleted successfully
   * @param {Node} node
   * @returns {Promise<void>}
   */
  async deleteNode(node) {
    console.log('========= delete node: ');
    console.log(node);
    console.log('=============');
    await sheepdogTasks.deleteNode(node);
    sheepdogQuestions.deleteNodeSuccess(node);
  },

  /**
   * Updates a node in sheepdog and asserts it was updated successfully
   * @param {Node} node
   * @returns {Promise<void>}
   */
  async updateNode(node) {
    await sheepdogTasks.addNode(node);
    sheepdogQuestions.updateNodeSuccess(node);
  },

  /**
   * Adds an array of nodes and asserts they were added successfully
   * @param {Node[]} nodesList
   * @returns {Promise<void>}
   */
  async addNodes(nodesList) {
    console.log(nodesList);
    await sheepdogTasks.addNodes(nodesList);
    sheepdogQuestions.addNodesSuccess(nodesList);
  },

  /**
   * Deletes an array of nodes and asserts they were deleted successfully
   * @param {Node[]} nodesList
   * @returns {Promise<void>}
   */
  async deleteNodes(nodesList) {
    await sheepdogTasks.deleteNodes(nodesList);
    sheepdogQuestions.deleteNodesSuccess(nodesList);
  },

  /**
   * Makes query for nodes in project and attempts to delete them all
   * Not to be used when there are many nodes in the database
   * For small cleanup only
   * @returns {Promise<void>}
   */
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
