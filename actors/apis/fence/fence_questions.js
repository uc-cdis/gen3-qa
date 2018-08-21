const url = require('url');

const chai = require('chai');

const expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const fence_props = require('./fence_props.js');

/**
 * fence Questions
 */
module.exports = {
  hasUrl(create_url_res) {
    expect(create_url_res).to.have.nested.property('body.url');
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
  },

  linkSuccess(link_res, linked_acct) {
    const link_url = new URL(link_res.url);
    expect(link_url.searchParams.get('linked_email')).to.equal(
      linked_acct.email,
    );
    expect(link_url.searchParams.get('exp')).to.not.be.null;
  },

  unlinkSuccess(unlink_res) {
    expect(unlink_res).to.have.property('statusCode', 200);
  },

  linkExtendSuccess(extend_res, time_request) {
    expect(extend_res).to.have.property('statusCode', 200);

    // Check the expiration is within expected range
    const time_buff = 60;
    expect(extend_res).to.have.nested.property('body.exp');
    expect(extend_res.body.exp).to.be.within(
      time_request + fence_props.linkExtendAmount - time_buff,
      time_request + fence_props.linkExtendAmount + time_buff,
    );
  },

  linkHasError(link_res, error_prop) {
    expect(link_res).to.have.property('statusCode', error_prop.statusCode);
    expect(link_res).to.have.nested.property('body.error', error_prop.error);
    expect(link_res).to.have.nested.property(
      'body.error_description',
      error_prop.error_description,
    );
  },
};
