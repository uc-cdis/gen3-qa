/**
 * A module providing util functions to handle indexd records
 * @module indexdLTUtils
 */
const ax = require('axios'); // eslint-disable-line import/no-extraneous-dependencies

module.exports = {
  /**
   * Fetch a list of random index records
   * @param {string} targetEnvironment
   * @param {string} indexdRecordACL
   * @param {string} indexdRecordAuthz
   * @returns {string[]}} list of indexd records / DIDs
   */
  fetchDIDList(targetEnvironment, indexdRecordACL = null, indexdRecordAuthz = null, indexdPaginationPage = 0, indexdPaginationPageSize = 1024) {
    return new Promise(((resolve, reject) => {
      var records = [];
      var ready = false;

      // handle list of authz
      if (indexdRecordAuthz !== null) {
        url = `/index/index?authz=${indexdRecordAuthz}&limit=${indexdPaginationPageSize}&page=${indexdPaginationPage}`;
        console.log(`fetching guids from https://${targetEnvironment}${url}`)

        ax.request({
          url,
          baseURL: `https://${targetEnvironment}`,
          method: 'get',
          maxRedirects: 0,
          header: {
            'content-type': 'application/json',
            accept: 'application/json',
          },
        }).then(
          (resp) => {
            resolve(resp.data.records);
          },
          (err) => {
            console.log(`err: ${JSON.stringify(err)}`);
            reject(err.response || err);
          }
        );
      } else {
        let url = '/index/index';
        if (indexdRecordACL) {
          url += `?acl=${indexdRecordACL}&page=${indexdPaginationPage}`;
        }
        console.log(`fetching guids from https://${targetEnvironment}${url}`)
        ax.request({
          url,
          baseURL: `https://${targetEnvironment}`,
          method: 'get',
          maxRedirects: 0,
          header: {
            'content-type': 'application/json',
            accept: 'application/json',
          },
        }).then(
          (resp) => {
            resolve(resp.data.records);
          },
          (err) => {
            console.log(`err: ${JSON.stringify(err)}`);
            reject(err.response || err);
          },
        );
      }
    }));
  },
};
