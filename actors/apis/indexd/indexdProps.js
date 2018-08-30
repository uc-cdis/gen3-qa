/**
 * indexd Properties
 */
const apiRoot = '/index/index';
module.exports = {
  endpoints: {
    root: apiRoot,
    add: `${apiRoot}/`,
    get: apiRoot,
    delete: apiRoot,
  },
};
