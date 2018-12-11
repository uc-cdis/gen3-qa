const fs = require('fs');

const I = actor();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  /**
   *
   */
  async createTmpFile(filePath) {
    let stream = fs.createWriteStream(filePath);
    stream.once('open', function(fd) {
      stream.write('this fake data file was generated and uploaded by the integration test suite\n');
      stream.end();
    });

    // wait for file to be created
    while (!fs.existsSync(filePath)) {
      await sleep(50);
    }
    console.log('Created temp file');
  },

  /**
   *
   */
  async deleteFile(filePath) {
    fs.unlink(filePath, (err) => {
      if (err) throw err;
    });
  },

  /**
   * /!\ returns 0 if the file was created during a different session (?)
   */
  async getFileSize(filePath) {
    var fileSize = fs.statSync(filePath).size;
    return fileSize;
  },

  /**
   *
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
      await sleep(50);
    }
    return fileMd5;
  },
};
