const { Gen3Response } = require('../../../utils/apiUtil');

/**
 * guppy Properties
 */

const namespace = process.env.NAMESPACE;
const hostname = process.env.HOSTNAME || 'https://' + namespace + '.planx-pla.net';

module.exports = {
  /**
   * Guppy endpoints
   */
  endpoints: {
    graphqlEndpoint: hostname + `/guppy/graphql`,
    downloadEndpoint: hostname + `/guppy/download`,
    hostname: hostname
  },  
};