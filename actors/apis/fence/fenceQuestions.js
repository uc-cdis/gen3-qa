const url = require('url');

const chai = require('chai');

const expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const fenceProps = require('./fenceProps.js');
const googleHelper = require('../../googleHelper.js');

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

  linkSuccess(linkRes, linkedAcct) {
    const linkUrl = new URL(linkRes.url);
    expect(linkUrl.searchParams.get('linked_email')).to.equal(
      linkedAcct.googleCreds.email,
    );
    expect(linkUrl.searchParams.get('exp')).to.not.be.null; // eslint-disable-line
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
      time_request + fenceProps.linkExtendAmount - time_buff,
      time_request + fenceProps.linkExtendAmount + time_buff,
    );
  },

  linkHasError(linkRes, errorProp) {
    const linkUrl = new URL(linkRes.url);
    expect(linkUrl.searchParams.get('error')).to.equal(errorProp.error);
    expect(linkUrl.searchParams.get('error_description')).to.equal(errorProp.error_description);
  },

  unlinkHasError(unlinkRes, errorProp) {
    expect(unlinkRes).to.have.property('statusCode', errorProp.statusCode);
    expect(unlinkRes).to.have.nested.property('body.error', errorProp.error);
    expect(unlinkRes).to.have.nested.property('body.error_description', errorProp.error_description);
  },

  linkExtendHasError(linkExtendRes, errorProp) {
    expect(linkExtendRes).to.have.property('statusCode', errorProp.statusCode);
    expect(linkExtendRes).to.have.nested.property('body.error', errorProp.error);
    expect(linkExtendRes).to.have.nested.property('body.error_description', errorProp.error_description);
  },

  membersHasUser(members, someUser) {
    expect(members).to.have.lengthOf.above(0);
    const memberEmails = members.map(member => member.email);
    expect(memberEmails).to.include(someUser.email);
  },
};
