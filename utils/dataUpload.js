/**
 * A module providing util functions for data upload
 * @module dataUploadUtil
 */

const fs = require('fs');
const request = require('request');
const homedir = require('os').homedir();

const inJenkins = (process.env.JENKINS_HOME !== '' && process.env.JENKINS_HOME !== undefined);
const { smartWait } = require('./apiUtil.js');
const files = require('./file.js');

const I = actor();

module.exports = {
  /**
   * upload a file to an S3 bucket using a presigned URL
   */
  async uploadFileToS3(presignedUrl, filePath, fileSize) {
    fs.createReadStream(filePath).pipe(request({
      method: 'PUT',
      url: presignedUrl,
      headers: {
        'Content-Length': fileSize,
      },
    }, (err, res, body) => {
      if (err) {
        throw new Error(err);
      }
      if (process.env.DEBUG === 'true') {
        console.log(`uploadFileToS3 res: ${res.statusCode}`);
        console.log(`uploadFileToS3 body: ${body.slice(0, 20)}`);
      }
    }));
  },

  /**
   * upload part of a file to an S3 bucket using a presigned URL
   * @returns {string} the ETag
   */
  async uploadFilePartToS3(presignedUrl, data) {
    return I.sendPutRequest(
      presignedUrl,
      data,
    ).then((res) => {
      if (!res.headers || !res.headers.etag) {
        console.error(res);
        console.error(res.headers);
        throw new Error('The S3 upload result dos not contain "headers.etag"');
      }
      return res.headers.etag.replace(new RegExp('"', 'g'), ''); // no quotes
    });
  },

  /**
   * create a file that contains the list of GUIDs of files that were uploaded
   * to s3 during this testing session. The files will be deleted during the
   * CleanS3 step of the Jenkins pipeline
   */
  async cleanS3(fileName, createdGuids) {
    if (inJenkins) {
      //
      // NOTE: put temp files in shared homedir/s3-cleanup,
      // so that the `CleanS3` Jenkins pipeline stage will
      // clean up after whatever jobs have come before even
      // if those jobs failed, and did not clean themselves up -
      // all the jenkins envs share the same S3 bucket
      //
      const dirName = `${homedir}/s3-cleanup`;
      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName);
      }
      await files.createTmpFile(
        `${dirName}/${fileName}`,
        createdGuids.join('\n'),
      );
      console.log(`Created ${fileName} in ${dirName}`);
    }
  },

  /**
   * wait until a file's hash and size are updated in indexd
   */
  async waitUploadFileUpdatedFromIndexdListener(indexd, fileNode) {
    /**
     * return true if the record has been updated in indexd, false otherwise
     */
    const isRecordUpdated = async function () {
      try {
        // check if indexd was updated with the correct hash and size
        await indexd.complete.checkFile(fileNode);
        return true;
      } catch (err) {
        console.log(`Error captured while checking file upload results: ${err}`);
        return false;
      }
    };

    const timeout = 120; // max number of seconds to wait
    const errorMessage = `The indexd listener did not complete the record after ${timeout} seconds`;

    await smartWait(isRecordUpdated, [indexd, fileNode], timeout, errorMessage);
  },
};
