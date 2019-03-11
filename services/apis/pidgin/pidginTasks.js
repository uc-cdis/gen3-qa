const pidginProps = require('./pidginProps.js');
let I = actor();

/**
 * pidgin Tasks
 */
module.exports = {
  
  getCoremetadata : async function(
    file, format = 'json', access_token) {
  
    // let accept = (format == 'bibtex' ? 'x-bibtex' : 'application/json');
    let token = {
      'Accept': format,
      'Authorization': access_token['Authorization']
    };
  
    let endpoint = `${pidginProps.endpoints.getCoreMetadata}/${file.did}`;
    return I.sendGetRequest(endpoint, token).then(
      (res) => {
        file.rev = res.body.rev;
        return res.body;
      }
    )
  }
};
