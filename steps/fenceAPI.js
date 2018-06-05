'use strict';

let username = process.env.INDEX_USERNAME;
let password = process.env.INDEX_PASSWORD;
let accessTokenHeaders = {
  'Accept': 'application/json',
  'Authorization': `bearer ${process.env.ACCESS_TOKEN}`
};
let indexAuth = Buffer.from(`${username}:${password}`).toString('base64');

module.exports.seeFileContentEqual = function(endpoint, id, args=[]) {
  return this.sendGetRequest(
    `${endpoint}${id}?${args.join('&')}`.replace(/[?]$/g, ''), accessTokenHeaders).then(
    (res) => {
      if (res.body.hasOwnProperty('url'))
        return this.sendGetRequest(res.body.url).then(
          (res) => {
            console.log(res.body);
            return res.body;
          }
        ).catch(
          (e) => {
            console.log(e);
            return e.message;
          }
        );
      else
        throw new Error(res.body.message);
    }).catch(
      (e) => {
        console.log(e);
        return e.message;
      }
    );
};

module.exports.addFileIndices = function(endpoint, files) {
  let uuid = require('uuid');
  let headers={
    'Accept': 'application/json',
    'Content-Type': 'application/json; charset=UTF-8',
    'Authorization': `Basic ${indexAuth}`
  };
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
            console.log(res.body);
            file.rev = res.body.rev;
          }
        );
    }
  )
};

module.exports.deleteFileIndices = function(endpoint, files) {
  let headers = {
    'Accept': 'application/json',
    'Authorization': `Basic ${indexAuth}`
  };
  files.forEach(
    (file) => {
      this.sendDeleteRequest(`${endpoint}${file.did}?rev=${file.rev}`,
        headers
      ).then(
        (res) => res.body
      )
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
      (res) => res.body
    );
};

module.exports.deleteAPIKey = function(endpoint, api_key) {
  return this.sendDeleteRequest(`${endpoint}${api_key}`, accessTokenHeaders)
    .then(
      (res) => res.body
    );
};

module.exports.getAccessToken = function (endpoint, api_key) {
  let headers={
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
  let data = (api_key !== null) ? { api_key: api_key } : {};
  return this.sendPostRequest(endpoint, JSON.stringify(data), headers)
    .then(
      (res) => res.body
    )
    .catch(
      (e) => e.message
    );
};
