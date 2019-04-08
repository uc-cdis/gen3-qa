const manifestServiceProps = require('./manifestServiceProps.js');
const chai = require('chai');
const { Gen3Response } = require('../../../utils/apiUtil.js');

const expect = chai.expect;

const I = actor();

/**
 * manifestService Tasks
 */
module.exports = {
  async postManifestForUser(userAcct) {
    return I.sendPostRequest(
      `${manifestServiceProps.endpoints.post}`,
      manifestServiceProps.dummyManifestData,
      {
        'Content-Type': 'application/json',
        Authorization: `bearer ${userAcct.accessToken}`,
      },
    ).then(res => res.body).then((data) => {
      expect(data).to.have.property('filename');
      return data.filename;
    });
  },

  async getManifestForUser(userAcct) {
    return I.sendGetRequest(
      `${manifestServiceProps.endpoints.get}`,
      {
        'Content-Type': 'application/json',
        Authorization: `bearer ${userAcct.accessToken}`,
      },
    ).then(res => JSON.stringify(res));
  },

};
