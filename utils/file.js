/**
 * A module providing util functions to handle files
 * @module fileUtil
 */

const fs = require('fs');

const { smartWait } = require('./apiUtil.js');

const I = actor();

module.exports = {
  /**
   * Create a file in local storage
   * @param {string} filePath - where to save the file
   * @param {string} dataString - file contents
   */
  async createTmpFile(filePath, dataString) {
    let stream = fs.createWriteStream(filePath);
    stream.once('open', function(fd) {
      stream.write(dataString);
      stream.end();
    });
  },

  /**
   * Delete a file from local storage
   * @param {string} filePath - file location
   */
  deleteFile(filePath) {
    fs.unlink(filePath, (err) => {
      if (err) throw err;
    });
  },

  /**
   * Get the size of a file in local storage
   * @param {string} filePath - file location
   * @returns {int}
   */
  async getFileSize(filePath) {
    /**
     * return true if the contents of file have been written, false otherwise
     */
    const isFileCreated = async function(filePath) {
      let fileSize = fs.statSync(filePath).size;
      return !(fileSize == 0);
    };

    const timeout = 5; // max number of seconds to wait
    let errorMessage = `The temp file was not created after ${timeout} seconds`;
    await smartWait(isFileCreated, [filePath], timeout, errorMessage);

    return fs.statSync(filePath).size;
  },

  /**
   * Get the md5 hash of a file in local storage
   * @param {string} filePath - file location
   * @returns {string}
   */
  async getFileHash(filePath) {
    var fd = fs.createReadStream(filePath);
    var hash = require('crypto').createHash('md5');
    hash.setEncoding('hex');
    fd.on('end', function() {
        hash.end();
    });
    fd.pipe(hash);

    return new Promise(function(resolve, reject) {
      fd.on('end', ()=>resolve(hash.read()));
    });
  },
};
