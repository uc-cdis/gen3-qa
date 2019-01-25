const dataClientQuestions = require('./dataClientQuestions.js');
const dataClientTasks = require('./dataClientTasks.js');

/**
 * dataClient sequences
 */
module.exports = {
  /**
   * Download a file, then asserts its contents are as expected
   * @param {string} guid - GUID of the file to download
   * @param {string} filePath - location to store the file
   */
  async downloadFile(files, guid, downloadPath, expectedContents) {
    await dataClientTasks.downloadFile(guid, downloadPath);
    await dataClientQuestions.fileContains(downloadPath, expectedContents);
    files.deleteFile(downloadPath);
  },
};
