const indexdQuestions = require('./indexdQuestions.js');
const indexdTasks = require('./indexdTasks.js');

/**
 * indexd sequences
 */
module.exports = {
  /**
   * Fetches file data from indexd then asserts it equals the file data provided
   * @param {Object} indexdFile - indexd file data to validate
   * @returns {Promise<void>}
   */
  async checkFile(indexdFile) {
    const res = await indexdTasks.getFile(indexdFile);
    indexdQuestions.fileEquals(res, indexdFile);
  },

  /**
   * Deletes a file from indexd, given that the file has did and rev data
   * @param {Object} indexdFile - indexd file to delete
   * @returns {Promise<void>}
   */
  async deleteFile(indexdFile) {
    await indexdTasks.deleteFile(indexdFile);
    indexdQuestions.deleteFileSuccess(indexdFile);
  },

  /**
   * Check if a record exists in indexd
   */
  async checkRecord(indexdFile) {
    const res = await indexdTasks.getFile(indexdFile);
    indexdQuestions.recordExists(res, indexdFile);
    return res;
  },
};
