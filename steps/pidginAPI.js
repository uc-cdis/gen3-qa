'use strict';

let util = require('./utilSteps');
let accessTokenHeader = util.getAccessTokenHeader();

module.exports.getJsonCoremetadata = async function(coremetadata_endpoint, file, access_token = accessTokenHeader) {
  let token = {
    'Accept': 'application/json',
    'Authorization': access_token['Authorization']
  };
  return this.sendGetRequest(`${coremetadata_endpoint}${file.did}`, token).then(
    (res) => {
      file.rev = res.body.rev;
      return res.body;
    }
  )
};

module.exports.getBibtexCoremetadata = async function(coremetadata_endpoint, file) {
  let token = {
    'Accept': 'x-bibtex',
    'Authorization': accessTokenHeader['Authorization']
  };
  return this.sendGetRequest(`${coremetadata_endpoint}${file.did}`, token).then(
    (res) => {
      file.rev = res.body.rev;
      return res.body;
    }
  )
};
