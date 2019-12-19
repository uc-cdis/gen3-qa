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
  async fetchDIDList(accessToken, targetEnvironment) {
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
      (resp) => console.log(resp.data),
      (err) => console.log(err.response || err),
    );
    return [];
  },
};
