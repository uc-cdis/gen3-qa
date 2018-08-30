const indexdQuestions = require('./indexdQuestions.js');
const indexdTasks = require('./indexdTasks.js');

/**
 * Sheepdog sequences
 */
module.exports = {
  async checkFile(file_node) {
    const res = await indexdTasks.getFile(file_node);
    indexdQuestions.fileEquals(res, file_node);
  },

  async deleteFile(file_node) {
    await indexdTasks.deleteFile(file_node);
    indexdQuestions.deleteFileSuccess(file_node);
  },
};
