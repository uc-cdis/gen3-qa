'use strict';

const indexd_questions = require('./indexd_questions.js');
const indexd_tasks = require('./indexd_tasks.js');

/**
 * Sheepdog sequences
 */
module.exports = {
  async checkFile(file_node) {
    let res = await indexd_tasks.getFile(file_node);
    indexd_questions.fileEquals(res, file_node);
  },

  async deleteFile(file_node) {
    await indexd_tasks.deleteFile(file_node);
    indexd_questions.deleteFileSuccess(file_node);
  }
};