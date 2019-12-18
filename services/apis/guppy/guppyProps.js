/**
 * guppy Properties
 */
const hostname = `https://${process.env.HOSTNAME}`;

module.exports = {
  /**
   * Guppy endpoints
   */
  endpoints: {
    graphqlEndpoint: `${hostname}/guppy/graphql`,
    downloadEndpoint: `${hostname}/guppy/download`,
    hostname,
  },
};
