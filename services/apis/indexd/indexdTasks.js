const uuid = require('uuid');

const indexdProps = require('./indexdProps.js');
const user = require('../../../utils/user.js');
const { Gen3Response } = require('../../../utils/apiUtil.js');

const I = actor();

/**
 * indexd Utils
 */
const getRevFromResponse = function (res) {
  try {
    return res.body.rev;
  } catch (e) {
    return 'ERROR_GETTING_INDEXD';
  }
};

/**
 * indexd Tasks
 */
module.exports = {
  /**
   * Adds files to indexd
   * @param {Object[]} files - array of indexd files
   * @returns {Promise<void>}
   */
  async addFileIndices(files) {
    const headers = user.mainAcct.indexdAuthHeader;
    headers['Content-Type'] = 'application/json; charset=UTF-8';
    files.forEach((file) => {
      file.did = uuid.v4().toString();
      const data = {
        file_name: file.filename,
        did: file.did,
        form: 'object',
        size: file.size,
        urls: [],
        hashes: { md5: file.md5 },
        acl: file.acl,
        metadata: file.metadata,
      };

      if (file.link !== null && file.link !== undefined) {
        data.urls = [file.link];
      }

      const strData = JSON.stringify(data);
      I.sendPostRequest(indexdProps.endpoints.add, strData, headers).then(
        (res) => {
          console.error(res.body)
          file.rev = res.body.rev;
        },
      );
    });
  },

  /**
   * Fetches indexd data for file and assigns 'rev', given an indexd file object with a did
   * @param {Object} fileNode - Assumed to have a did property
   * @returns {Promise<Gen3Response>}
   */
  async getFile(file) {
    // get data from indexd
    return I.sendGetRequest(
      `${indexdProps.endpoints.get}/${file.did}`,
      user.mainAcct.accessTokenHeader,
    ).then((res) => {
      file.rev = getRevFromResponse(res);
      return res.body;
    });
  },

  /**
   * Deletes the file from indexd, given an indexd file object with did and rev
   * Response is added to the file object
   * @param {Object} file
   * @returns {Promise<Promise|*|PromiseLike<T>|Promise<T>>}
   */
  async deleteFile(file) {
    return I.sendDeleteRequest(
      `${indexdProps.endpoints.delete}/${file.did}?rev=${file.rev}`,
      user.mainAcct.indexdAuthHeader,
    ).then((res) => {
      // Note that we use the entire response, not just the response body
      file.indexd_delete_res = res;
      return res;
    });
  },

  /**
   * Deletes multiple files from indexd
   * @param {Object[]} files
   * @returns {Promise<void>}
   */
  async deleteFileIndices(files) {
    files.forEach((file) => {
      this.deleteFile(file);
    });
  },

  /**
   * Remove the records created in indexd by the test suite
   * @param {array} guidList - list of GUIDs of the files to delete
   */
  async deleteFiles(guidList) {
    var fileList = []
    for (guid of guidList) {
      var file = {
        did: guid
      };
      await this.getFile(file); // adds 'rev' to the file
      var res = await this.deleteFile(file);
      fileList.push(file)
    }
    return fileList;
  },
};
