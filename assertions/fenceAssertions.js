'use strict';

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;


module.exports.seeFenceHasError = function(res, status_code, error_message) {
  expect(res).to.have.property('statusCode', status_code);
  expect(res).to.have.property('body');
  expect(res.body).to.have.string(error_message);
};