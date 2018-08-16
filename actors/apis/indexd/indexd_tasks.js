'use strict';
  
const indexd_props = require('./indexd_props.js');
const commons_helper = require('../../commons_helper.js');
let I = actor();

/**
 * indexd Helpers
 */
const _getRevFromResponse = function(res) {
  try {
    return res.body.rev;
  } catch(e) {
    return "ERROR_GETTING_INDEXD"
  }
};

/**
 * indexd Tasks
 */
module.exports = {
  async addFileIndices(files) {
    let uuid = require('uuid');
    let headers = commons_helper.validIndexAuthHeader;
    headers['Content-Type'] = 'application/json; charset=UTF-8';
    files.forEach( (file) => {
        file.did = uuid.v4().toString();
        let data = {
          file_name: file.filename,
          did: file.did,
          form: 'object',
          size: file.size,
          urls: [],
          hashes: {'md5': file.md5},
          acl: file.acl,
          metadata: file.metadata};

        if (file.link !== null && file.link !== undefined)
          data.urls = [file.link];

        let strData = JSON.stringify(data);
        I.sendPostRequest(indexd_props.endpoints.add, strData, headers)
          .then(
            (res) => {
              file.rev = res.body.rev;
            }
          );
      }
    )
  },

  async getFile(file_node) {
    // get data from indexd
    return I.sendGetRequest(`${indexd_props.endpoints.get}/${file_node.did}`,
      commons_helper.validAccessTokenHeader).then(
      (res) => {
        file_node.rev = _getRevFromResponse(res);
        return res.body;
      }
    )
  },

  async deleteFile (file_node) {
    return I.sendDeleteRequest(`${indexd_props.endpoints.delete}/${file_node.did}?rev=${file_node.rev}`,
      commons_helper.validIndexAuthHeader
    ).then(
      (res) => {
        // Note that we use the entire response, not just the response body
        file_node.indexd_delete_res = res;
        return res;
      }
    )
  },

  async deleteFileIndices(files) {
    files.forEach(
      (file) => {
        this.deleteFileIndex(file);
      }
    );
  }
};

  