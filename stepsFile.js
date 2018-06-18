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
  submitFile,
  deleteFile,
  addNodes,
  deleteNodes
} = require('./steps/sheepdogAPI');
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
    submitFile: submitFile,
    deleteFile: deleteFile,
    addNodes: addNodes,
    deleteNodes: deleteNodes
  });
};
