const pidginProps = require('./pidginProps.js');

const I = actor();

/**
 * pidgin Tasks
 */
module.exports = {

  async getCoremetadata(
    file, format = 'application/json', access_token) {
    const token = {
      Accept: format,
      Authorization: access_token.Authorization,
    };

    const endpoint = `${pidginProps.endpoints.getCoreMetadata}/${file.did}`;
    return I.sendGetRequest(endpoint, token).then(res => res.data);
  },
};
