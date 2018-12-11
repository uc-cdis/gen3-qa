/**
 * indexd Properties
 */
const apiRoot = '/index/index';
module.exports = {
  /**
   * indexd endpoints
   */
  endpoints: {
    root: apiRoot,
    add: `${apiRoot}/`,
    get: apiRoot,
    delete: apiRoot,
    updateBlank: `${apiRoot}/blank`, // TODO: Remove when indexd-listener works
  },
};
