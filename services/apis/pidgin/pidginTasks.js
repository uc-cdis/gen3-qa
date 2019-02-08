const pidginProps = require('./pidginProps.js');
let I = actor();

/**
 * pidgin Tasks
 */
module.exports = {
  
  util : require('./utilSteps'),
  accessTokenHeader : util.getAccessTokenHeader(),
  
  getCoremetadata : async function(
    file, format = 'json', access_token = accessTokenHeader) {
  
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
  }
};
