'use strict';
// in this file you can append custom step methods to 'I' object

const { load } = require('./steps/homepage');
const { loginGoogle } = require('./steps/loginGoogle');
const { seeFileContentEqual } = require('./steps/fenceAPI');
const { seeHomepageDetails } = require('./questions/homepageDetails');

module.exports = function() {
  return actor({
    load: load,
    seeHomepageDetails: seeHomepageDetails,
    loginGoogle: loginGoogle,
    seeFileContentEqual: seeFileContentEqual,
  });
};
