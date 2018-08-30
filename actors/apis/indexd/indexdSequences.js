const indexdQuestions = require('./indexdQuestions.js');
const indexdTasks = require('./indexdTasks.js');

/**
 * Sheepdog sequences
 */
module.exports = {
  async checkFile(fileNode) {
    const res = await indexdTasks.getFile(fileNode);
    indexdQuestions.fileEquals(res, fileNode);
  },

  async deleteFile(fileNode) {
    await indexdTasks.deleteFile(fileNode);
    indexdQuestions.deleteFileSuccess(fileNode);
  },
};
