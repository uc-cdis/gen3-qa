const chai = require('chai');

const expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const fenceQuestions = require('./fenceQuestions.js');
const fenceTasks = require('./fenceTasks.js');
const fenceProps = require('./fenceProps.js');

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
   * Deletes a file from indexd and S3
   * @param {string} guid - GUID of the file to delete
   */
  async deleteFile(guid) {
    const res = await fenceTasks.deleteFile(guid);
    fenceQuestions.assertStatusCode(res, 204);
  },
};
