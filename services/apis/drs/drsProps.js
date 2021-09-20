const { Gen3Response } = require('../../../utils/apiUtil');
/**
 * DRS Properties
 */
const apiRoot = '/ga4gh/drs/v1/objects';
module.exports = {
  /**
   * DRS endpoints
   */
  endpoints: {
    root: apiRoot,
    add: `${apiRoot}/`,
    get: apiRoot,
    getFile: `${apiRoot}/`,
    put: apiRoot,
    delete: apiRoot,
  },

  /**
   * Create Access Token Responses
   */

  /**
   * Presigned URL responses
   */
  resInvalidFileProtocol: new Gen3Response({
    request: {},
    status: 404,
  }),

  noAccessToken: new Gen3Response({
    request: {},
    status: 401,
  }),
};
