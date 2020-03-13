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
};
