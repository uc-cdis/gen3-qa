'use strict';
// in this file you can append custom step methods to 'I' object

const {
  load,
  verifyLink
} = require('./steps/homepage');
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
const { seeSubmissionDetails } = require('./questions/submissionDetails');

module.exports = function() {
  return actor({
    load: load,
    verifyLink: verifyLink,
    seeHomepageDetails: seeHomepageDetails,
    seeSubmissionDetails: seeSubmissionDetails,
    loginGoogle: loginGoogle,
    addFileIndices: addFileIndices,
    createAPIKey: createAPIKey,
    deleteAPIKey: deleteAPIKey,
    deleteFileIndices: deleteFileIndices,
    getAccessToken: getAccessToken,
    seeFileContentEqual: seeFileContentEqual,
  });
};
