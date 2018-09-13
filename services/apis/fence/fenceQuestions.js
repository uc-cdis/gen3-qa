const chai = require('chai');

const { gen3Res } = require('../../../utils/apiUtil');

const expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;
chai.use(gen3Res);

const fenceProps = require('./fenceProps.js');

/**
 * fence Questions
 */
module.exports = {
  hasUrl(createUrlRes) {
    expect(createUrlRes).to.have.nested.property('body.url');
  },

  hasAPIKey(apiKeyRes) {
    expect(apiKeyRes).to.have.nested.property('body.api_key');
  },

  hasAccessToken(accessTokenRes) {
    expect(accessTokenRes).has.nested.property('body.access_token');
  },

  linkSuccess(linkRes, linkedAcct) {
    expect(linkRes).to.have.property('finalURL');
    const linkUrl = new URL(linkRes.finalURL);
    expect(linkUrl.searchParams.get('linked_email')).to.equal(
      linkedAcct.googleCreds.email,
    );
    expect(linkUrl.searchParams.get('exp')).to.not.be.null; // eslint-disable-line
  },

  forceLinkSuccess(linkRes) {
    // Expect res to be some non-zero integer
    const num = Number(linkRes);
    expect(num).to.not.be.NaN; // eslint-disable-line
    expect(num).to.not.equal(0);
  },

  unlinkSuccess(unlinkRes) {
    expect(unlinkRes).to.have.property('statusCode', 200);
  },

  linkExtendSuccess(extendRes, timeRequest) {
    expect(extendRes).to.have.property('statusCode', 200);

    // Check the expiration is within expected range
    const timeBuff = 60;
    expect(extendRes).to.have.nested.property('body.exp');
    expect(extendRes.body.exp).to.be.within(
      (timeRequest + fenceProps.linkExtendAmount) - timeBuff,
      (timeRequest + fenceProps.linkExtendAmount) + timeBuff,
    );
  },

  linkHasError(linkRes, errorProp) {
    expect(linkRes).to.have.property('finalURL');
    const linkUrl = new URL(linkRes.finalURL);
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

  responsesEqual(actualRes, expectedRes) {
    expect(actualRes).to.be.a.gen3Res(expectedRes);
  },
};
