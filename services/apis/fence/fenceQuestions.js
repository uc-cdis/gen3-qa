const chai = require('chai');

const { gen3Res } = require('../../../utils/apiUtil');

const expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;
chai.use(gen3Res);

const fenceProps = require('./fenceProps.js');
const google = require('../../../utils/google.js');

/**
 * fence Questions
 */
module.exports = {
  /**
   * Asserts a res has url property
   * @param createUrlRes
   */
  hasUrl(createUrlRes) {
    expect(createUrlRes, 'Fence did not return a URL (check fence logs for more info on why)').to.have.nested.property('body.url');
  },

  /**
   * Asserts a res does not have url property
   * @param createUrlRes
   */
  hasNoUrl(createUrlRes) {
    expect(createUrlRes, 'Fence should not have returned a URL').to.not.have.nested.property('body.url');
  },

  /**
   * Asserts a res has api key property
   * @param apiKeyRes
   */
  hasAPIKey(apiKeyRes) {
    expect(apiKeyRes,
      'response does not have a "api_key" field in the body'
    ).to.have.nested.property('body.api_key');
  },

  /**
   * Asserts a res has access token property
   * @param accessTokenRes
   */
  hasAccessToken(accessTokenRes) {
    expect(accessTokenRes,
      'response does not have a "access_token" field in the body'
    ).has.nested.property('body.access_token');
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
   * Asserts google link res was successful
   * @param {Gen3Response} linkRes - linking response
   */
  mockedLinkSuccess(linkRes) {
    expect(linkRes,
      'response after Google linking doesnt have finalURL prop'
    ).to.have.property('finalURL');

    const linkUrl = new URL(linkRes.finalURL);

    console.log(`when checking mocked Google Linking success, got final URL: ${linkUrl}`)

    expect(linkUrl.searchParams.get('linked_email'),
      'response after Google linking doesnt include linked_email'
    ).to.not.be.null;

    expect(linkUrl.searchParams.get('exp'),
      'response after Google linking doesnt include exp'
    ).to.not.be.null; // eslint-disable-line
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
   * @param {int} expires_in - requested expiration time (in seconds)
   */
  linkExtendSuccess(extendRes, timeRequest, expires_in=null) {
    expect(extendRes).to.have.property('statusCode', 200);

    // Check the expiration is within expected range
    const timeBuff = 60;
    expect(extendRes).to.have.nested.property('body.exp');
    if (!expires_in) {
      expires_in = fenceProps.linkExtendDefaultAmount;
    }
    expect(extendRes.body.exp, 'the link expiration is not in the expected range').to.be.within(
      (timeRequest + expires_in) - timeBuff,
      (timeRequest + expires_in) + timeBuff,
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

  /**
   *
   * @param createRes - response from google api for creating service account
   * @param name - expected name for new service account
   */
  createServiceAccountSuccess(createRes, name) {
    expect(createRes).to.have.property('email');
    expect(createRes.email).to.contain(name);
  },

  /**
   *
   * @param deleteRes - response from google api for creating service account
   */
  deleteServiceAccountSuccess(deleteRes) {
    expect(deleteRes).to.be.empty;
  },

  /**
   * Assert that the response has tokens
   * @param {Gen3Response} response
   */
  asssertTokensSuccess(response) {
    expect(response).to.have.property('statusCode', 200);
    expect(response).to.have.nested.property('body.access_token');
    expect(response).to.have.nested.property('body.refresh_token');
    expect(response).to.have.nested.property('body.id_token');
    expect(response).to.have.nested.property('body.expires_in');
  },

  /**
   * Assert that the response status code
   * @param {Gen3Response} response
   * @param {int} statusCode HTTP response code
   * @param {string} msg Message to display in case of failure
   */
  assertStatusCode(response, statusCode, msg='') {
    err = 'Wrong status code: ' + msg;
    expect(response, err).to.have.property('statusCode', statusCode);
  },

  /**
   * Assert that the stringURL contains sub-strings
   * @param {string} resURL - response url
   * @param {array} containSubStr
   * @param {array} notContainSubStr
   */
  assertContainSubStr(resURL, containSubStr) {
    let i;
    for (i = 0; i < containSubStr.length; i += 1) {
      expect(resURL).to.contain(containSubStr[i]);
    }
  },

  /**
   * Assert that the stringURL contains sub-strings
   * @param {string} resURL - response url
   * @param {array} containSubStr
   * @param {array} notContainSubStr
   */
  assertNotContainSubStr(resURL, notContainSubStr) {
    let i;
    for (i = 0; i < notContainSubStr.length; i += 1) {
      expect(resURL).to.not.contain(notContainSubStr[i]);
    }
  },

  /**
   * Assert that response have user info
   * @param {Gen3Response} response
   */
  assertUserInfo(response) {
    expect(response).to.have.property('statusCode', 200);
    expect(response).to.have.nested.property('body.username');
    expect(response).to.have.nested.property('body.user_id');
  },

  /**
   * Assert that response have new access token
   * @param {Gen3Response} response
   */
  assertRefreshAccessToken(response) {
    expect(response).to.have.property('statusCode', 200);
    expect(response).to.have.nested.property('body.access_token');
    expect(response).to.have.nested.property('body.refresh_token');
    expect(response).to.have.nested.property('body.expires_in');
  },

  assertTruthyResult(result, msg='') {
    err = `Expected a parameter to be "truthy" but received ${result}: ` + msg;
    expect(!!result, err).to.be.true;
  },

  /**
   * Check the google-manage-user-registrations output for invalid project
   */
  detected_invalid_google_project(jobResponse, reason='') {
    let errMsg = '"google-manage-user-registrations" should have detected an invalid Google project';
    expect(jobResponse, errMsg).to.contain('INVALID GOOGLE PROJECT');
    expect(jobResponse, errMsg).to.contain(reason);
  },
};
