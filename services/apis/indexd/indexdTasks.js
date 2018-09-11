const uuid = require('uuid');

const indexdProps = require('./indexdProps.js');
const usersUtil = require('../../../utils/usersUtil.js');

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
  async addFileIndices(files) {
    const headers = usersUtil.mainAcct.indexdAuthHeader;
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
          file.rev = res.body.rev;
        },
      );
    });
  },

  async getFile(fileNode) {
    // get data from indexd
    return I.sendGetRequest(
      `${indexdProps.endpoints.get}/${fileNode.did}`,
      usersUtil.mainAcct.accessTokenHeader,
    ).then((res) => {
      fileNode.rev = getRevFromResponse(res);
      return res.body;
    });
  },

  async deleteFile(fileNode) {
    return I.sendDeleteRequest(
      `${indexdProps.endpoints.delete}/${fileNode.did}?rev=${fileNode.rev}`,
      usersUtil.mainAcct.indexdAuthHeader,
    ).then((res) => {
      // Note that we use the entire response, not just the response body
      fileNode.indexd_delete_res = res;
      return res;
    });
  },

  async deleteFileIndices(files) {
    files.forEach((file) => {
      this.deleteFile(file);
    });
  },
};
