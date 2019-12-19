/**
 * A module providing util functions to handle indexd records
 * @module indexdLTUtils
 */
const ax = require('axios'); // eslint-disable-line import/no-extraneous-dependencies

module.exports = {
  /**
   * Fetch a list of random index records
   * @param {string} accessToken
   * @param {string} targetEnvironment
   * @returns {string[]}} list of indexd records / DIDs
   */
  fetchDIDList(accessToken, targetEnvironment) {
    return new Promise(((resolve, reject) => {
      ax.request({
        url: '/user/user',
        baseURL: `https://${targetEnvironment}`,
        method: 'get',
        maxRedirects: 0,
        header: {
          Authorization: `bearer ${accessToken}`,
          'content-type': 'application/json',
          accept: 'application/json',
        },
      }).then(
        (resp) => resolve(resp.data),
        (err) => reject(err.response || err),
      );
    }));
  },
};
