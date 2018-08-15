'use strict';

const sheepdog_questions = require('./sheepdog_questions.js');
const sheepdog_tasks = require('./sheepdog_tasks.js');

/**
 * Sheepdog sequences
 */
module.exports = {
  async addNode(node) {
    await sheepdog_tasks.addNode(node);
    sheepdog_questions.addNodeSuccess(node);
  },

  async deleteNode(node) {
    await sheepdog_tasks.deleteNode(node);
    sheepdog_questions.deleteNodeSuccess(node);
  },

  async updateNode(node) {
    await sheepdog_tasks.addNode(node);
    sheepdog_questions.updateNodeSuccess(node);
  },

  async addNodes (nodes_list) {
    await sheepdog_tasks.addNodes(nodes_list);
    sheepdog_questions.addNodesSuccess(nodes_list);
  },

  async deleteNodes (nodes_list) {
    await sheepdog_tasks.deleteNodes(nodes_list);
    sheepdog_questions.deleteNodesSuccess(nodes_list);
  }
};