'use strict';

let util = require('./utilSteps');
let accessTokenHeaders = util.getAccessTokenHeader();


module.exports.createSignedUrl = function(endpoint, id, args=[]) {
  return this.sendGetRequest(
    `${endpoint}${id}?${args.join('&')}`.replace(/[?]$/g, ''), accessTokenHeaders).then(
      (res) => res
  );
};


module.exports.getSignedUrl = function(url) {
  return this.sendGetRequest(url).then(
    (res) => res.body
  );
};


module.exports.addFileIndices = function(endpoint, files) {
  let uuid = require('uuid');
  let headers = util.getIndexAuthHeader();
  headers['Content-Type'] = 'application/json; charset=UTF-8';
  files.forEach(
    (file) => {
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
      this.sendPostRequest(endpoint, strData, headers)
        .then(
          (res) => {
            file.rev = res.body.rev;
          }
        );
    }
  )
};

module.exports.deleteFileIndex = function(endpoint, file) {
  let headers = util.getIndexAuthHeader();
  return this.sendDeleteRequest(`${endpoint}${file.did}?rev=${file.rev}`,
    headers
  ).then(
    (res) => {
      file.indexd_delete_res = res;
      return res;
    }
  )
};

module.exports.deleteFileIndices = function(endpoint, files) {
  files.forEach(
    (file) => {
      this.deleteFileIndex(endpoint, file);
    }
  );
};

module.exports.createAPIKey = function(endpoint, scope, access_token) {
  let headers={
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `bearer ${access_token}`
  };
  return this.sendPostRequest(
    endpoint,
    JSON.stringify({
      scope: scope
    }),
    headers)
    .then(
      (res) => res
    );
};

module.exports.deleteAPIKey = function(endpoint, api_key) {
  return this.sendDeleteRequest(`${endpoint}${api_key}`, accessTokenHeaders)
    .then(
      (res) => res.body
    );
};

module.exports.getAccessToken = function (endpoint, api_key) {
  let headers = util.getIndexAuthHeader();
  let data = (api_key !== null) ? { api_key: api_key } : {};
  return this.sendPostRequest(endpoint, JSON.stringify(data), headers)
    .then(
      (res) => res
    );
};
