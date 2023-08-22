/*eslint-disable */
/**
 * A module providing util functions to handle files
 * @module fileUtil
 */

const fs = require('fs');
const { smartWait } = require('./apiUtil.js');

module.exports = {
  /**
   * Create a file in local storage
   * @param {string} filePath - where to save the file
   * @param {string} dataString - file contents
   */
  async createTmpFile(filePath, dataString) {
    const stream = fs.createWriteStream(filePath);
    stream.once('open', (fd) => {
      stream.write(dataString);
      stream.end();
    });

    /**
     * return true if the contents of file have been written, false otherwise
     */
    const isFileCreated = async function (filePath) {
      if (!fs.existsSync(filePath)) return false;
      const fileSize = fs.statSync(filePath).size;
      return !(fileSize == 0);
    };

    const timeout = 30; // max number of seconds to wait
    const errorMessage = `The file at ${filePath} was not created after ${timeout} seconds`;
    await smartWait(isFileCreated, [filePath], timeout, errorMessage);
  },

  /**
   * Create a file in local storage
   */
  async createTmpFileWithRandomName(fileContents) {
    const rand = (Math.random() + 1).toString(36).substring(2, 7); // 5 random chars
    const fileName = `qa-upload-file_${rand}.txt`;
    const filePath = `./${fileName}`;
    await module.exports.createTmpFile(filePath, fileContents);
    const fileSize = await module.exports.getFileSize(filePath);
    const fileMd5 = await module.exports.getFileHash(filePath);
    return {
      fileName,
      filePath,
      fileSize,
      fileMd5,
    };
  },

  /**
   * Create a large file in local storage
   * @param {string} filePath - where to save the file
   * @param {string} megabytes - size of the file in MB
   */
  async createBigTmpFile(filePath, megabytes) {
    // this contains 1024 bytes = 1KB of text
    const text = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi sit amet iaculis neque, at mattis mi. Donec pharetra lacus sit amet dui tincidunt, a varius risus tempor. Duis dictum sodales dignissim. Ut luctus turpis non nibh pretium consequat. Fusce faucibus vulputate magna vel congue. Proin sit amet libero mauris. Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sed dictum lacus. Vestibulum bibendum ipsum quis lacus dignissim euismod. Mauris et dignissim leo. Phasellus pretium molestie nunc, varius gravida augue congue quis. Maecenas faucibus, velit dignissim feugiat viverra, eros diam tempor tortor, sed maximus mi justo a massa. Mauris at metus tincidunt augue iaculis mollis et id eros. Interdum et malesuada fames ac ante ipsum primis in faucibus. Aliquam sagittis porta vestibulum. Cras molestie nulla metus, a sollicitudin neque suscipit nec. Nunc sem lectus, molestie eu mauris eget, volutpat posuere mauris. Donec gravida venenatis sodales. Pellentesque risus lorem, pulvinar nec molestie eu amet. ';
    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath, { flags: 'w' });
      // 1MB = 1024 times the previous text
      for (let i = 0; i < megabytes * 1024; i++) {
        writeStream.write(text);
      }
      writeStream.end();
      writeStream.on('finish', () => {
        console.log(`Created ${megabytes}MB file "${filePath}"`);
        resolve();
      });
      writeStream.on('error', reject);
    });
  },

  /**
   * Delete a file from local storage
   * @param {string} filePath - file location
   */
  deleteFile(filePath) {
    fs.unlink(filePath, (err) => {
      if (err) throw err;
      console.log(`Deleted file "${filePath}"`);
    });
  },

  /**
   * Check if the file exists
   * @param {string} filePath - file location
   */
  fileExists(filePath) {
    try {
      if (fs.existsSync(filePath)) {
	return true;
      } else {
        return false;
      }
    } catch(err) {
      console.error(err)
    }
  },

  /**
   * Get the size of a file in local storage
   * @param {string} filePath - file location
   * @returns {int}
   */
  getFileSize(filePath) {
    return fs.statSync(filePath).size;
  },

  /**
   * Get the md5 hash of a file in local storage
   * @param {string} filePath - file location
   * @returns {string}
   */
  async getFileHash(filePath) {
    const fd = fs.createReadStream(filePath);
    const hash = require('crypto').createHash('md5');
    hash.setEncoding('hex');
    fd.on('end', () => {
      hash.end();
    });
    fd.pipe(hash);

    return new Promise(((resolve, reject) => {
      fd.on('end', () => resolve(hash.read()));
    }));
  },
};
