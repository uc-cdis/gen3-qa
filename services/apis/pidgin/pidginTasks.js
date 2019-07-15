const pidginProps = require('./pidginProps.js');
let I = actor();

/**
 * pidgin Tasks
 */
module.exports = {
  
  getCoremetadata : async function(
    file, format = 'application/json', access_token) {
  
    let token = {
      'Accept': format,
      'Authorization': access_token['Authorization']
    };
  
    let endpoint = `${pidginProps.endpoints.getCoreMetadata}/${file.did}`;
    return I.sendGetRequest(endpoint, token).then(res => res.data);
  }
};
