'use strict';
  
const fence_props = require('./fence_props.js');
const commons_helper = require('../../../commons_helper.js')
let I = actor();

/**
 * fence Tasks
 */
module.exports = {
  createSignedUrl(id, args=[]) {
    return I.sendGetRequest(
      `${fence_props.endpoints.getFile}/${id}?${args.join('&')}`.replace(/[?]$/g, ''),
      commons_helper.validAccessTokenHeader)
      .then(
      (res) => {
        return res;
      }
    );
  },

  getFile(url) {
    return I.sendGetRequest(url).then( res => res.body);
  },

  createAPIKey(scope, access_token) {
    let headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `bearer ${access_token}`
    };
    return I.sendPostRequest(
      fence_props.endpoints.createAPIKey,
      JSON.stringify({
        scope: scope
      }),
      headers)
      .then(
        (res) => res
      );
  },

  deleteAPIKey(api_key) {
    return I.sendDeleteRequest(
      `${fence_props.endpoints.deleteAPIKey}/${api_key}`,
      commons_helper.validAccessTokenHeader)
        .then(
          (res) => res.body
        );
  },

  getAccessToken(api_key) {
    let data = (api_key !== null) ? { api_key: api_key } : {};
    return I.sendPostRequest(
      fence_props.endpoints.getAccessToken,
      JSON.stringify(data),
      commons_helper.validIndexAuthHeader)
        .then(
          (res) => res
        );
  }

};
