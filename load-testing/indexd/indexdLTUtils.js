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
  fetchDIDList(targetEnvironment, indexdRecordACL = null) {
    return new Promise(((resolve, reject) => {
      // TODO: dynamically identify the records accessible by the owner of the access token
      // allowing user to provide the url for the indexd query for now
      let url = '/index/index';
      if (indexdRecordACL) {
        url += `?acl=${indexdRecordACL}`;
      }
      ax.request({
        // e.g., url: '/index/index?url=s3://cdis-presigned-url-test/dcp-s3-test-1.txt',
        url,
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
          // console.log(resp.data);
          resolve(resp.data.records);
        },
        (err) => {
          console.log(`err: ${JSON.stringify(err)}`);
          reject(err.response || err);
        },
      );
    }));
  },
};
