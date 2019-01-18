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

    /**
     * return true if the contents of file have been written, false otherwise
     */
    const isFileCreated = async function(filePath) {
      if (!fs.existsSync(filePath)) return false;
      let fileSize = fs.statSync(filePath).size;
      return !(fileSize == 0);
    };

    const timeout = 5; // max number of seconds to wait
    let errorMessage = `The file at ${filePath} was not created after ${timeout} seconds`;
    await smartWait(isFileCreated, [filePath], timeout, errorMessage);
  },

  /**
   * Create a file in local storage
   */
  async createTmpFileWithRandomeNameAndContent() {
    let rand = (Math.random() + 1).toString(36).substring(2,7); // 5 random chars
    const fileName = `qa-upload-file_${rand}.txt`;
    const filePath = './' + fileName;
    const fileContents = 'this fake data file was generated and uploaded by the integration test suite\n';
    await this.createTmpFile(filePath, fileContents);
    const fileSize = await this.getFileSize(filePath);
    const fileMd5 = await this.getFileHash(filePath);
    return {
      fileName,
      filePath,
      fileSize,
      fileMd5,
    };
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
  getFileSize(filePath) {
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

  /**
   * upload a file to an S3 bucket using a presigned URL
   */
  async uploadFileToS3(presignedUrl, filePath, fileSize) {
    fs.createReadStream(filePath).pipe(require('request')({
      method: 'PUT',
      url: presignedUrl,
      headers: {
        'Content-Length': fileSize
      }
    }, function (err, res, body) {
      if (err) {
        throw new Error(err);
      }
    }));
  },

  /**
   * wait until a file's hash and size are updated in indexd
   */
  async waitUploadFileUpdatedFromIndexdListener(indexd, fileNode) {
    /**
     * return true if the record has been updated in indexd, false otherwise
     */
    const isRecordUpdated = async function(indexd, fileNode) {
      try {
        // check if indexd was updated with the correct hash and size
        await indexd.complete.checkFile(fileNode);
        return true;
      }
      catch {
        return false;
      }
    };

    const timeout = 45; // max number of seconds to wait
    let errorMessage = `The indexd listener did not complete the record after ${timeout} seconds`;

    await smartWait(isRecordUpdated, [indexd, fileNode], timeout, errorMessage);
  },

  /**
   * link metadata to an indexd file via sheepdog
   * /!\ this function does not include a check for success or
   * failure of the data_file node's submission
   */
  async submitFileMetadata(sheepdog, nodes, fileGuid, fileSize, fileMd5) {
    // prepare graph for metadata upload (upload parent nodes)
    await sheepdog.complete.addNodes(nodes.getPathToFile());

    // submit metadata with object id via sheepdog
    metadata = nodes.getFileNode().clone();
    metadata.data.object_id = fileGuid;
    metadata.data.file_size = fileSize;
    metadata.data.md5sum = fileMd5;
    await sheepdog.do.addNode(metadata); // submit, but don't check for success

    // the result of the submission is stored in metadata.addRes by addNode()
    return metadata;
  },
};
