const drsQuestions = require('./drsQuestions.js');
const drsTasks = require('./drsTasks.js');

/**
 * indexd sequences
 */
module.exports = {
  /**
   * Fetches file data from indexd then asserts it equals the file data provided
   * @param {Object} drsRecord - indexd file data to validate
   * @returns {Promise<void>}
   */
  async checkFile(drsRecord) {
    const res = await drsTasks.getDrsObject(drsRecord.data);
    drsQuestions.fileEquals(res, drsRecord);
  },

  /**
   * Deletes a file from indexd, given that the file has did and rev data
   * @param {Object} drsRecord - indexd file to delete
   * @returns {Promise<void>}
   */
  async deleteFile(drsRecord) {
    const res = await drsTasks.deleteFile(drsRecord);
    drsQuestions.deleteFileSuccess(drsRecord, res);

    const getRes = await drsTasks.getFileFullRes(drsRecord);
    drsQuestions.recordDoesNotExist(getRes);
  },

  /**
   * Checks if a record exists in indexd
   * @param {Object} drsRecord
   * @returns {Promise<Gen3Response>}
   */
  async checkRecordExists(drsRecord) {
    const res = await drsTasks.getDrsObject(drsRecord);
    drsQuestions.recordExists(res, drsRecord);
    return res;
  },

    /**
   * Checks if a record doesn't exist in indexd
   * @param {Object} drsRecord
   * @returns {Promise<Gen3Response>}
   */
  async checkRecordExists(drsRecord) {
    const res = await drsTasks.getDrsObject(drsRecord);
    drsQuestions.recordDoesNotExist(res, drsRecord);
    return res;
  },

  /**
   * Remove the records created in indexd by the test suite
   * @param {array} guidList - list of GUIDs of the files to delete
   */
  async deleteFiles(guidList) {
    const fileList = await drsTasks.deleteFiles(guidList);
    drsQuestions.deleteFilesSuccess(fileList);
  },
};
