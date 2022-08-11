const manifestServiceProps = require('./manifestServiceProps.js');

const I = actor();

/**
 * manifestService Tasks
 */
module.exports = {
  /*
     Using dummy data to create manifests for a given user account
     by POSTing to the manifestservice endpoint
  */
  async postManifestForUser(userAcct) {
    if (process.env.DEBUG === 'true') {
      console.log(`debug token: ${userAcct.accessToken}`);
    }
    return I.sendPostRequest(
      `${manifestServiceProps.endpoints.post}`,
      manifestServiceProps.dummyManifestData,
      {
        'Content-Type': 'application/json',
        Authorization: `bearer ${userAcct.accessToken}`,
      },
    );
  },

  async extractManifestFilenameFromResponse(res) {
    return res.data.filename;
  },

  /* Retrieve manifests for a given user account by GETing from the manifestservice endpoint */
  async getManifestForUser(userAcct) {
    return I.sendGetRequest(
      `${manifestServiceProps.endpoints.get}`,
      {
        'Content-Type': 'application/json',
        Authorization: `bearer ${userAcct.accessToken}`,
      },
    ).then((res) => JSON.stringify(res.data));
  },

};
