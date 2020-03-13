const { Gen3Response } = require('../../../utils/apiUtil');
/**
 * DRS Properties
 */
const apiRoot = '/index/ga4gh/drs/v1/objects';
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
  resExpiredAccessToken: new Gen3Response({
    request: {},
    status: 401,
  }),

  resInvalidAPIKey: new Gen3Response({
    request: {},
    status: 401,
  }),

  resMissingAPIKey: new Gen3Response({
    request: {},
    status: 400,
  }),

  /**
   * Presigned URL responses
   */
  resMissingFilePermission: new Gen3Response({
    request: {},
    status: 401,
  }),

  resInvalidFileProtocol: new Gen3Response({
    request: {},
    status: 404,
  }),

  resNoFileProtocol: new Gen3Response({
    request: {},
    status: 404,
  }),

  noAccessToken: new Gen3Response({
    request: {},
    body: { 'msg': 'Not Authorized. Please Log In.'},
    data: { 'msg': 'Not Authorized. Please Log In.'},
    status: 403,
  }),

};
