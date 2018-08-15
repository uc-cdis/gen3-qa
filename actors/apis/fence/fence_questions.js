'use strict';
  
let chai = require('chai');
let expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const fence_props = require('./fence_props.js');

/**
 * fence Questions
 */
module.exports = {
  hasUrl(create_url_res) {
    expect(create_url_res).to.have.nested.property('body.url')
  },

  hasAPIKey(api_key_res) {
    expect(api_key_res).to.have.nested.property('body.api_key');
  },

  hasAccessToken(access_token_res) {
    expect(access_token_res).has.nested.property('body.access_token');
  },

  hasError(res, status_code, error_message) {
    expect(res).to.have.property('statusCode', status_code);
    expect(res).to.have.property('body');
    expect(res.body).to.have.string(error_message);
  }
};

