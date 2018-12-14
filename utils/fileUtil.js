/**
 * A module providing util functions to handle files
 * @module fileUtil
 */

const fs = require('fs');

const { sleep } = require('./apiUtil.js');

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
  async deleteFile(filePath) {
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
    var fileSize = 0;
    // wait for file to be created
    do {
      await sleep(10);
      fileSize = fs.statSync(filePath).size;
    } while (fileSize == 0);
    return fileSize;
  },

  /**
   * Get the md5 hash of a file in local storage
   * @param {string} filePath - file location
   * @returns {string}
   */
  async getFileHash(filePath) {
    var fileMd5 = -1;
    var fd = fs.createReadStream(filePath);
    var hash = require('crypto').createHash('md5');
    hash.setEncoding('hex');
    fd.on('end', function() {
        hash.end();
        fileMd5 = hash.read();
    });
    fd.pipe(hash);

    // wait for hash to be computed
    while (fileMd5 == -1) {
      await sleep(10);
    }
    return fileMd5;
  },
};
