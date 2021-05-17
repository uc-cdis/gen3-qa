const mdsProps = require('./mdsProps.js');

const I = actor();
/**
 * manifestService Tasks
 */
module.exports = {
  createMetadataRecord(accessTokenHeader, guid, record) {
    I.sendPostRequest(`${mdsProps.endpoints.metadata}/${guid}`, record, accessTokenHeader);
  },

  deleteMetadataRecord(accessTokenHeader, guid) {
    I.sendDeleteRequest(`${mdsProps.endpoints.metadata}/${guid}`);
  },
};
