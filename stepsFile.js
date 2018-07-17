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
const { seeHomepageDetails } = require('./questions/homepageDetails');
const {
  getAllNodes,
  getNodePathToFile
} = require('./steps/utilSteps');

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
    getAllNodes: getAllNodes,
    getNodePathToFile: getNodePathToFile
  });
};
