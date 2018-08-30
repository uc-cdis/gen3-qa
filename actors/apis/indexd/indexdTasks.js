const indexdProps = require('./indexdProps.js');
const usersHelper = require('../../usersHelper.js');

const I = actor();

/**
 * indexd Helpers
 */
const _getRevFromResponse = function(res) {
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
    const uuid = require('uuid');
    const headers = usersHelper.mainAcct.indexdAuthHeader;
    headers['Content-Type'] = 'application/json; charset=UTF-8';
    files.forEach(file => {
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
        res => {
          file.rev = res.body.rev;
        },
      );
    });
  },

  async getFile(file_node) {
    // get data from indexd
    return I.sendGetRequest(
      `${indexdProps.endpoints.get}/${file_node.did}`,
      usersHelper.mainAcct.accessTokenHeader,
    ).then(res => {
      file_node.rev = _getRevFromResponse(res);
      return res.body;
    });
  },

  async deleteFile(file_node) {
    return I.sendDeleteRequest(
      `${indexdProps.endpoints.delete}/${file_node.did}?rev=${file_node.rev}`,
      usersHelper.mainAcct.indexdAuthHeader,
    ).then(res => {
      // Note that we use the entire response, not just the response body
      file_node.indexd_delete_res = res;
      return res;
    });
  },

  async deleteFileIndices(files) {
    files.forEach(file => {
      this.deleteFile(file);
    });
  },
};
