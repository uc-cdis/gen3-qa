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
  fetchDIDList(targetEnvironment) {
    return new Promise(((resolve, reject) => {
      // TODO: dynamically identify the records accessible by the owner of the access token
      // hardcoding the acl for now
      ax.request({
        url: '/index/index?url=s3://cdis-presigned-url-test/dcp-s3-test-2.bam',
        baseURL: `https://${targetEnvironment}`,
        method: 'get',
        maxRedirects: 0,
        header: {
          // Authorization: `bearer ${accessToken}`,
          'content-type': 'application/json',
          accept: 'application/json',
        },
      }).then(
        (resp) => {
          console.log(resp.data);
          resolve(resp.data.records);
        },
        (err) => reject(err.response || err),
      );
    }));
  },
};
