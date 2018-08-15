'use strict';
  
let util = require('../../../steps/utilSteps');

/**
 * indexd Properties
 */
const api_root = `/index/index`;
module.exports = {
  endpoints: {
    root: api_root,
    add: `${api_root}/`,
    get: api_root,
    delete: api_root
  },

  validAuthHeader: util.getIndexAuthHeader(),
  validAccessTokenHeader: util.getAccessTokenHeader(),
};
  
  