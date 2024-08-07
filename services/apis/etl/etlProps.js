/**
 * indexd Properties
 */
const apiRoot = 'http://localhost:9200';
module.exports = {
  /**
   * es endpoints
   */
  endpoints: {
    root: apiRoot,
    alias: `${apiRoot}/_alias`,
  },
};
