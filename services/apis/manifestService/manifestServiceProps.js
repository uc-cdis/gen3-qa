/**
 * manifestService Properties
 */
const apiRoot = '/manifests/';

module.exports = {
  endpoints: {
    root: apiRoot,
    get: apiRoot,
    post: apiRoot,
  },

  dummyManifestData: [{
    object_id: 'fake_object_id',
    case_id: 'fake_case_id',
  }],
};
