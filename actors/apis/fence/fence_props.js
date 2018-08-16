'use strict';

/**
 * fence Properties
 */
let root_endpoint = '/user';
module.exports = {
  endpoints: {
    root: root_endpoint,
    getFile: `${root_endpoint}/data/download`,
    createAPIKey: `${root_endpoint}/credentials/api/`,
    deleteAPIKey: `${root_endpoint}/credentials/api/cdis`,
    getAccessToken: `${root_endpoint}/credentials/api/access_token`
  }
};
