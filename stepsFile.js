'use strict';
// in this file you can append custom step methods to 'I' object

const { load } = require('./steps/homepage');
const { loginGoogle } = require('./steps/loginGoogle');
const {
  addFileIndices,
  createAPIKey,
  deleteAPIKey,
  deleteFileIndices,
  getAccessToken,
  seeFileContentEqual,
} = require('./steps/fenceAPI');
const {
  getIndexd,
  didFromFileId,
  submitFile,
  deleteFile,
  addNode,
  addNodes,
  deleteNode,
  deleteNodes
} = require('./steps/sheepdogAPI');
const {
  gqlNodeExists,
  gqlQuery,
  gqlCountType,
} = require('./steps/graphqlAPI');
const { seeHomepageDetails } = require('./questions/homepageDetails');

module.exports = function() {
  return actor({
    load: load,
    seeHomepageDetails: seeHomepageDetails,
    loginGoogle: loginGoogle,
    addFileIndices: addFileIndices,
    createAPIKey: createAPIKey,
    deleteAPIKey: deleteAPIKey,
    deleteFileIndices: deleteFileIndices,
    getAccessToken: getAccessToken,
    seeFileContentEqual: seeFileContentEqual,
    getIndexd: getIndexd,
    didFromFileId: didFromFileId,
    submitFile: submitFile,
    deleteFile: deleteFile,
    addNode: addNode,
    addNodes: addNodes,
    deleteNode: deleteNode,
    deleteNodes: deleteNodes,
    gqlNodeExists: gqlNodeExists,
    gqlQuery: gqlQuery,
    gqlCountType: gqlCountType
  });
};
