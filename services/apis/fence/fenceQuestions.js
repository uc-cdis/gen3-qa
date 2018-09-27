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
  /**
   * Asserts a res has url property
   * @param createUrlRes
   */
  hasUrl(createUrlRes) {
    expect(createUrlRes).to.have.nested.property('body.url');
  },

  /**
   * Asserts a res has api key property
   * @param apiKeyRes
   */
  hasAPIKey(apiKeyRes) {
    expect(apiKeyRes).to.have.nested.property('body.api_key');
  },

  /**
   * Asserts a res has access token property
   * @param accessTokenRes
   */
  hasAccessToken(accessTokenRes) {
    expect(accessTokenRes).has.nested.property('body.access_token');
  },

  /**
   * Asserts google link res was successful
   * @param {Gen3Response} linkRes - linking response
   * @param {User} linkedAcct - the account that was linked TO (ie their google email)
   */
  linkSuccess(linkRes, linkedAcct) {
    expect(linkRes).to.have.property('finalURL');
    const linkUrl = new URL(linkRes.finalURL);
    expect(linkUrl.searchParams.get('linked_email')).to.equal(
      linkedAcct.googleCreds.email,
    );
    expect(linkUrl.searchParams.get('exp')).to.not.be.null; // eslint-disable-line
  },

  /**
   * Asserts that a forced linking was successful
   * @param linkRes
   */
  forceLinkSuccess(linkRes) {
    // Expect res to be some non-zero integer
    const num = Number(linkRes);
    expect(num).to.not.be.NaN; // eslint-disable-line
    expect(num).to.not.equal(0);
  },

  /**
   * Asserts that deleting google link was successful
   * @param unlinkRes
   */
  unlinkSuccess(unlinkRes) {
    expect(unlinkRes).to.have.property('statusCode', 200);
  },

  /**
   * Asserts that extending google link was successful
   * @param extendRes
   * @param timeRequest
   */
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

  /**
   * Asserts the Gen3Responses are equal
   * @param {Gen3Response} actualRes
   * @param {Gen3Response} expectedRes
   */
  responsesEqual(actualRes, expectedRes) {
    expect(actualRes).to.be.a.gen3Res(expectedRes);
  },
};
