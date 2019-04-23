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
   * @param {int} expires_in - requested expiration time (in seconds)
   * @returns {Promise<Gen3Response>}
   */
  async linkGoogleAcctMocked(userAcct, expires_in=null) {
    const linkRes = await fenceTasks.linkGoogleAcctMocked(userAcct, expires_in);
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
    expect(
      unlinkRes.statusCode,
      'response from unlinking Google Account does not have expected statusCode of 200 or 404'
    ).to.be.oneOf([200, 404])
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
   * @param {Object} accessTokenHeaders
   * @param {int} expires_in - requested expiration time (in seconds)
   * @returns {Promise<Gen3Response>}
   */
  async createTempGoogleCreds(accessTokenHeaders, expires_in=null) {
    const response = await fenceTasks.createTempGoogleCreds(accessTokenHeaders, expires_in);
    expect(response,
      'response from creating temporary Google credentials does not have nested ' +
      'property body.private_key (which means we didn\'t get back valid Google credentials)'
    ).has.nested.property('body.private_key');
    return response;
  },

  /**
   * Deletes a file from indexd and S3
   * @param {string} guid - GUID of the file to delete
   */
  async deleteFile(guid) {
    const res = await fenceTasks.deleteFile(guid);
    fenceQuestions.assertStatusCode(res, 204);
  },

  /**
   * Cleans up fence's DBs for links and service accounts
   * Takes the google and users utils as params
   * @returns {Promise<void>}
   */
  async suiteCleanup(google, users) {
    // google projects to 'clean up'
    const googleProjects = [
      fenceProps.googleProjectA,
      fenceProps.googleProjectDynamic,
      fenceProps.googleProjectWithComputeServiceAcct,
    ];
    // remove unimportant roles from google projects
    for (const proj of googleProjects) {
      await google.removeAllOptionalUsers(proj.id);
    }

    // delete all service accounts from fence
    for (const proj of googleProjects) {
      // TRY to delete the service account
      // NOTE: the service account might have been registered unsuccessfully or deleted,
      //  we are just hitting the endpoints as if it still exists and ignoring errors
      const projUser = users.mainAcct;

      if (!projUser.linkedGoogleAccount) {
        // If the project user is not linked, link to project owner then delete
        await fenceTasks.forceLinkGoogleAcct(projUser, proj.owner)
          .then(() =>
          fenceTasks.deleteGoogleServiceAccount(projUser, proj.serviceAccountEmail),
          );
      } else if (projUser.linkedGoogleAccount !== proj.owner) {
        // If the project user is linked, but not to project owner,
        // unlink user, then link to project owner and delete service account
        await module.exports.unlinkGoogleAcct(projUser)
          .then(() =>
          fenceTasks.forceLinkGoogleAcct(projUser, proj.owner),
          )
          .then(() =>
          fenceTasks.deleteGoogleServiceAccount(projUser, proj.serviceAccountEmail),
          );
      } else {
        // If project user is linked to the project owner, delete the service account
        await fenceTasks.deleteGoogleServiceAccount(projUser, proj.serviceAccountEmail);
      }
    }

    // unlink all google accounts
    const unlinkPromises = Object.values(users).map(user => fenceTasks.unlinkGoogleAcct(user));
    await Promise.all(unlinkPromises);
  },
};
