'use strict';
// in this file you can append custom step methods to 'I' object

const{
  getAccessTokenHeader,
  getIndexAuthHeader,
  getProgramName,
  getProjectName,
  getIndexdRoot,
  getSheepdogRoot,
  getCoreMetadataRoot,
  getAllNodes,
  getNodePathToFile,
  sortNodes,
} = require('./steps/utilSteps');

const{
  clone,
  extractFile,
} = require('./suites/apis/utilApis');

const { load } = require('./steps/homepage');

const { seeHomepageDetails } = require('./assertions/homepageDetails');

const { loginGoogle } = require('./steps/loginGoogle');

const {
  addFileIndices,
  createAPIKey,
  deleteAPIKey,
  deleteFileIndex,
  deleteFileIndices,
  getAccessToken,
  createSignedUrl,
} = require('./steps/fenceAPI');

const { seeFenceHasError } = require('./assertions/fenceAssertions');

const {
  getIndexdFile,
  didFromFileId,
  submitFile,
  addNode,
  addNodes,
  deleteNode,
  deleteNodes,
  deleteByIdRecursively,
  findDeleteAllNodes,
} = require('./steps/sheepdogAPI');

const {
  seeIndexdGetFilePass,
  seeIndexdEqualsFile,
  seeFileDeleteSuccess,
} = require('./assertions/indexdAssertions');

const {
  makeGraphQLNodeQuery,
  makeGraphQLQuery,
  graphQLCountType,
} = require('./steps/graphqlAPI');

const {
  seeNodePass,
  seeNodeAddSuccess,
  seeNodeDeleteSuccess,
  seeNodeUpdateSuccess,
  seeAllNodesAddSuccess,
  seeAllNodesDeleteSuccess,
  seeSheepdogHasEntityError,
  seeSheepdogHasTransactionalError,
} = require('./assertions/sheepdogAssertions');

const {
  seeGraphQLPass,
  seeAllGraphQLPass,
  seeGraphQLHasField,
  seeNumberOfGraphQLField,
  seeGraphQLFail,
  seeGraphQLHasError,
  seeGraphQLNodeEqual,
  seeAllGraphQLNodesEqual,
  seeGraphQLNodeCountIncrease,
  seeAllGraphQLNodeCountIncrease,
} = require('./assertions/peregrineAssertions');

const { getCoremetadata } = require('./steps/pidginAPI');

const {
  seeJsonCoremetadata,
  seeBibtexCoremetadata,
  seePidginError,
} = require('./assertions/pidginAssertions');


module.exports = function() {
  return actor({
    // Util Steps
    getAccessTokenHeader: getAccessTokenHeader,
    getIndexAuthHeader: getIndexAuthHeader,
    getProgramName: getProgramName,
    getProjectName: getProjectName,
    getIndexdRoot: getIndexdRoot,
    getSheepdogRoot: getSheepdogRoot,
    getCoreMetadataRoot: getCoreMetadataRoot,
    getAllNodes: getAllNodes,
    getNodePathToFile: getNodePathToFile,
    sortNodes: sortNodes,

    // Util Apis
    clone: clone,
    extractFile: extractFile,

    // Homepage Steps
    load: load,

    // Homepage Assertions
    seeHomepageDetails: seeHomepageDetails,

    // Google Steps
    loginGoogle: loginGoogle,

    // Fence (??) Steps TODO: some of these functions probably need to be moved into another steps file
    addFileIndices: addFileIndices,
    createAPIKey: createAPIKey,
    deleteAPIKey: deleteAPIKey,
    deleteFileIndex: deleteFileIndex,
    deleteFileIndices: deleteFileIndices,
    getAccessToken: getAccessToken,
    createSignedUrl: createSignedUrl,

    // Fence Assertions
    seeFenceHasError: seeFenceHasError,

    // Sheepdog/Indexd Steps
    getIndexdFile: getIndexdFile,
    didFromFileId: didFromFileId,
    submitFile: submitFile,
    addNode: addNode,
    addNodes: addNodes,
    deleteNode: deleteNode,
    deleteNodes: deleteNodes,
    deleteByIdRecursively: deleteByIdRecursively,
    findDeleteAllNodes: findDeleteAllNodes,

    // Indexd Assertions
    seeIndexdGetFilePass: seeIndexdGetFilePass,
    seeIndexdEqualsFile: seeIndexdEqualsFile,
    seeFileDeleteSuccess: seeFileDeleteSuccess,

    // Peregrine Steps
    makeGraphQLNodeQuery: makeGraphQLNodeQuery,
    makeGraphQLQuery: makeGraphQLQuery,
    graphQLCountType: graphQLCountType,

    // Sheepdog Assertions
    seeNodePass: seeNodePass,
    seeNodeAddSuccess: seeNodeAddSuccess,
    seeNodeDeleteSuccess: seeNodeDeleteSuccess,
    seeNodeUpdateSuccess: seeNodeUpdateSuccess,
    seeAllNodesAddSuccess: seeAllNodesAddSuccess,
    seeAllNodesDeleteSuccess: seeAllNodesDeleteSuccess,
    seeSheepdogHasEntityError: seeSheepdogHasEntityError,
    seeSheepdogHasTransactionalError: seeSheepdogHasTransactionalError,

    // Peregrine Assertions
    seeGraphQLPass: seeGraphQLPass,
    seeAllGraphQLPass: seeAllGraphQLPass,
    seeGraphQLHasField: seeGraphQLHasField,
    seeNumberOfGraphQLField: seeNumberOfGraphQLField,
    seeGraphQLFail: seeGraphQLFail,
    seeGraphQLHasError: seeGraphQLHasError,
    seeGraphQLNodeEqual: seeGraphQLNodeEqual,
    seeAllGraphQLNodesEqual: seeAllGraphQLNodesEqual,
    seeGraphQLNodeCountIncrease: seeGraphQLNodeCountIncrease,
    seeAllGraphQLNodeCountIncrease: seeAllGraphQLNodeCountIncrease,

    // Pidgin Steps
    getCoremetadata: getCoremetadata,

    // Pidgin Assertions
    seeJsonCoremetadata: seeJsonCoremetadata,
    seeBibtexCoremetadata: seeBibtexCoremetadata,
    seePidginError: seePidginError,
  });
};
