const chai = require('chai');

const expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const fenceQuestions = require('./fenceQuestions.js');
const fenceTasks = require('./fenceTasks.js');
const fenceProps = require('./fenceProps.js');
const { Gen3Response } = require('../../../utils/apiUtil');

const I = actor();

/**
 * fence sequences
 */
module.exports = {
  /**
   * Gets a files contents then asserts their contents are as expected
   * @param {Object} signedUrlRes - result from creating a signed url
   * @param {string} contents - expected file contents
   * @returns {Promise<void>}
   */
  async checkFileEquals(signedUrlRes, contents) {
    fenceQuestions.hasUrl(signedUrlRes);
    const fileContents = await fenceTasks.getFile(signedUrlRes.body.url);
    expect(fileContents).to.equal(contents);
  },

  /**
   * Links a google account then asserts it was successful
   * @param {User} userAcct - commons account to link with
   * @returns {Promise<Gen3Response>}
   */
  async linkGoogleAcctMocked(userAcct) {
    const linkRes = await fenceTasks.linkGoogleAcctMocked(userAcct);
    fenceQuestions.mockedLinkSuccess(linkRes);
    return linkRes;
  },

  /**
   * Hits fences endpoint to DELETE a google link then asserts it was successful or there
   * wan't a linked account to begin with
   * @param {User} userAcct - user to delete link for
   * @returns {Promise<void>}
   */
  async forceUnlinkGoogleAcct(userAcct) {
    const unlinkRes = await fenceTasks.unlinkGoogleAcct(userAcct);
    expect(unlinkRes,
      'response from unlinking Google Account does not have expected statusCode property'
    ).to.have.property('statusCode');
    // can be 200 or 404
  },

  /**
   * WARNING: not functional currently since google may challenge login with a captcha
   * Links a google account then asserts it was successful
   * @param {User} userAcct - commons account to link with
   * @param {User} acctWithGoogleCreds - account whose google email to link to
   * @returns {Promise<Gen3Response>}
   */
  async linkGoogleAcct(userAcct, acctWithGoogleCreds) {
    const linkRes = await fenceTasks.linkGoogleAcct(userAcct, acctWithGoogleCreds);
    fenceQuestions.linkSuccess(linkRes, acctWithGoogleCreds);
    return linkRes;
  },

  /**
   * WARNING: circumvents google authentication (ie not like true linking process)
   * Forces a linking in fences databases then asserts success
   * @param {User} userAcct - commons account to link with
   * @param {string} googleEmail - email to link to
   * @returns {Promise<string>}
   */
  async forceLinkGoogleAcct(userAcct, googleEmail) {
    const linkRes = await fenceTasks.forceLinkGoogleAcct(userAcct, googleEmail);
    fenceQuestions.forceLinkSuccess(linkRes);
    return linkRes;
  },

  /**
   * Hits fences endpoint to DELETE a google link then asserts it was successful
   * @param {User} userAcct - user to delete link for
   * @returns {Promise<void>}
   */
  async unlinkGoogleAcct(userAcct) {
    const unlinkRes = await fenceTasks.unlinkGoogleAcct(userAcct);
    fenceQuestions.responsesEqual(unlinkRes, fenceProps.resUnlinkSuccess);
  },

  /**
   * Creates an api key then asserts it was successful
   * @param {string[]} scope - access token scopes
   * @param {Object} accessTokenHeaders
   * @returns {Promise<Gen3Response>}
   */
  async createAPIKey(scope, accessTokenHeaders) {
    const apiKeyRes = await fenceTasks.createAPIKey(scope, accessTokenHeaders);
    fenceQuestions.hasAPIKey(apiKeyRes);
    return apiKeyRes;
  },

  /**
   * Creates temporary Google Access creds then asserts it was successful
   * @param {string[]} scope - access token scopes
   * @param {Object} accessTokenHeaders
   * @returns {Promise<Gen3Response>}
   */
  async createTempGoogleCreds(accessTokenHeaders) {
    const response = await fenceTasks.createTempGoogleCreds(accessTokenHeaders);
    expect(response,
      'response from creating temporary Google credentials does not have nested ' +
      'property body.private_key (which means we didn\'t get back valid Google credentials.'
    ).has.nested.property('body.private_key');
    return response;
  },

  /**
   * Hits fence's endoint to delete temp Google credentials
   * @param {string} googleKeyId
   * @param {Object} accessTokenHeader
   * @returns {Promise<Gen3Response>}
   */
  deleteTempGoogleCreds(googleKeyId, accessTokenHeader) {
    accessTokenHeader['Content-Type'] = 'application/json';
    return I.sendDeleteRequest(
      `${fenceProps.endpoints.googleCredentials}${googleKeyId}`,
      accessTokenHeader,
    ).then(res => new Gen3Response(res)); // ({ body: res.body, statusCode: res.statusCode }));
  },

  /**
   * Deletes a file from indexd and S3
   * @param {string} guid - GUID of the file to delete
   */
  async deleteFile(guid) {
    const res = await fenceTasks.deleteFile(guid);
    fenceQuestions.assertStatusCode(res, 204);
  }
};
