const drsProps = require('./drsProps.js');
const user = require('../../../utils/user.js');
const { Gen3Response } = require('../../../utils/apiUtil.js');

const I = actor();

/**
 * indexd Utils
 */
const getRevFromResponse = function (res) {
  try {
    return res.data.rev;
  } catch (e) {
    console.log(`Could not get res.data.rev from response: ${res}`);
    return 'ERROR_GETTING_INDEXD';
  }
};


/**
 * drs Tasks
 */
module.exports = {
  /**
   * Fetches drs object for file and assigns 'rev', given an indexd file object with a did
   * @param {Object} file - Assumed to have a did property
   * @param {Object} authHeaders - headers in include in request. defaults to main
   *                 user account (mainAcct)'s access token
   * @returns {Promise<Gen3Response>}
   */
  async getDrsObject(file, authHeaders = user.mainAcct.accessTokenHeader) {
    // get data from indexd
    id = file.did || file.id
    return I.sendGetRequest(
      `${drsProps.endpoints.get}/${id}`,
      authHeaders,
    ).then((res) => {
      file.rev = getRevFromResponse(res);
      return new Gen3Response(res);
    });
  },

  /**
   * Fetches signed url for file, given an indexd file object with a did
   * @param {Object} file - Assumed to have a did property
   * @param {Object} authHeaders - headers in include in request. defaults to main
   *                 user account (mainAcct)'s access token
   * @returns {Promise<Gen3Response>}
   */
  async getDrsSignedUrl(file, authHeaders = user.mainAcct.accessTokenHeader) {
    // get signed url from fence
    id = file.did || file.id;
    access_id = file.link.substr(0,2);
    return I.sendGetRequest(
      `${drsProps.endpoints.get}/${id}/access/${access_id}`,
      authHeaders,
    ).then((res) => {
      file.rev = getRevFromResponse(res);
      return new Gen3Response(res);
    });
  },

  /**
   * Fetches signed url for file without sending header information, 
   * @param {Object} file - Assumed to have a did property
   * @returns {Promise<Gen3Response>}
   */
  async getDrsSignedUrlWithoutHeader(file) {
    // get data from indexd
    id = file.did || file.id;
    access_id = file.link.substr(0,2);
    return I.sendGetRequest(
      `${drsProps.endpoints.get}/${id}/access/${access_id}`,
    ).then((res) => {
      file.rev = getRevFromResponse(res);
      return new Gen3Response(res);
    });
  },

  /**
   * Hits fence's signed url endpoint
   * @param {string} file - id/did of an indexd file
   * @param {string[]} args - additional args for endpoint
   * @returns {Promise<Gen3Response>}
   */
  async createSignedUrl(file, args = [], userHeader = user.mainAcct.accessTokenHeader) {
    access_id = file.link;
    access_id = access_id.substr(0,2);
    id = file.did || file.id;
    return I.sendGetRequest(
        `${drsProps.endpoints.getFile}/${id}/accdss/${access_id}`.replace(
          /[?]$/g,
          '',
        ),
      userHeader,
    ).then((res) => new Gen3Response(res)); // ({ body: res.body, statusCode: res.statusCode }));
  },
};
