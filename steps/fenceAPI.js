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
    `${endpoint}${id}?${args.join('&')}`, accessTokenHeaders).then(
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
      let data = JSON.stringify({
        file_name: file.filename,
        did: file.did,
        form: 'object',
        size: file.size,
        urls: [file.link],
        hashes: {'md5': file.md5},
        metadata: file.metadata});
      this.sendPostRequest(endpoint, data, headers)
        .then(
          (res) => {
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
        (res) => {
          console.log(res.body)
        }
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
    headers);
};

module.exports.deleteAPIKey = function(endpoint, api_key) {
  return this.sendDeleteRequest(`${endpoint}${api_key}`, accessTokenHeaders)
    .then(
      (res) => {
        console.log(res.body);
      }
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
      (res) => {
        console.log(res.body);
        return res.body;
      })
    .catch(
      (e) => {
        console.log(e);
        return e.message;
      }
    );
};
