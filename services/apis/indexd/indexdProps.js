/**
 * indexd Properties
 */
const apiRoot = 'index/index';
module.exports = {
  /**
   * indexd endpoints
   */
  endpoints: {
    root: apiRoot,
    add: `${apiRoot}/`,
    get: apiRoot,
    put: apiRoot,
    delete: apiRoot,
  },
};
