'use strict';

let util = require('./utilSteps');
let accessTokenHeader = util.getAccessTokenHeader();

module.exports.getCoremetadata = async function(file, format = 'json', access_token = accessTokenHeader) {

  let accept = (format == 'bibtex' ? 'x-bibtex' : 'application/json');
  let token = {
    'Accept': accept,
    'Authorization': access_token['Authorization']
  };

  let endpoint = this.getCoreMetadataRoot();
  return this.sendGetRequest(`${endpoint}${file.did}`, token).then(
    (res) => {
      file.rev = res.body.rev;
      return res.body;
    }
  )
};
