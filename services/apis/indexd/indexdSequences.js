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
   * Checks if a record exists in indexd
   * @param {Object} indexdFile
   * @returns {Promise<Gen3Response>}
   */
  async checkRecord(indexdFile) {
    const res = await indexdTasks.getFile(indexdFile);
    indexdQuestions.recordExists(res, indexdFile);
    return res;
  },

  /**
   * Remove the records created in indexd by the test suite
   * @param {array} guidList - list of GUIDs of the files to delete
   */
  async deleteFiles(guidList) {
    const fileList = await indexdTasks.deleteFiles(guidList);
    indexdQuestions.deleteFilesSuccess(fileList);
  },
};
