const chai = require('chai');

const expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const guppyQuestions = require('./guppyQuestions.js');
const guppyTasks = require('./guppyTasks.js');
const guppyProps = require('./guppyProps.js');
const { Gen3Response } = require('../../../utils/apiUtil');
const user = require('../../../utils/user.js');

const I = actor();

/**
 * guppy sequences
 */
module.exports = {
  async checkQueryResponseEquals() {
    guppyQuestions.hasUrl(signedUrlRes);
    const fileContents = await guppyTasks.getFile(signedUrlRes.body.url);
    expect(fileContents).to.equal(contents);
  }


  // /**
  //  * Gets a files contents then asserts their contents are as expected
  //  * @param {Object} signedUrlRes - result from creating a signed url
  //  * @param {string} contents - expected file contents
  //  * @returns {Promise<void>}
  //  */
  // async checkFileEquals(signedUrlRes, contents) {
  //   guppyQuestions.hasUrl(signedUrlRes);
  //   const fileContents = await guppyTasks.getFile(signedUrlRes.body.url);
  //   expect(fileContents).to.equal(contents);
  // },

  // /**
  //  * Creates an api key then asserts it was successful
  //  * @param {string[]} scope - access token scopes
  //  * @param {Object} accessTokenHeaders
  //  * @returns {Promise<Gen3Response>}
  //  */
  // async createAPIKey(scope, accessTokenHeaders) {
  //   const apiKeyRes = await guppyTasks.createAPIKey(scope, accessTokenHeaders);
  //   guppyQuestions.hasAPIKey(apiKeyRes);
  //   return apiKeyRes;
  // },

  // /**
  //  * Cleans up guppy's DBs for links and service accounts
  //  * Takes the google and users utils as params
  //  * @returns {Promise<void>}
  //  */
  // async suiteCleanup(google, users) {
  //   // google projects to 'clean up'
  //   const googleProjects = [
  //     guppyProps.googleProjectA,
  //     guppyProps.googleProjectDynamic,
  //     guppyProps.googleProjectWithComputeServiceAcct,
  //   ];
  //   // remove unimportant roles from google projects
  //   for (const proj of googleProjects) {
  //     await google.removeAllOptionalUsers(proj.id);
  //   }

  //   // delete all service accounts from guppy
  //   for (const proj of googleProjects) {
  //     // TRY to delete the service account
  //     // NOTE: the service account might have been registered unsuccessfully or deleted,
  //     //  we are just hitting the endpoints as if it still exists and ignoring errors
  //     const projUser = users.mainAcct;

  //     if (!projUser.linkedGoogleAccount) {
  //       // If the project user is not linked, link to project owner then delete
  //       await guppyTasks.forceLinkGoogleAcct(projUser, proj.owner)
  //         .then(() =>
  //         guppyTasks.deleteGoogleServiceAccount(projUser, proj.serviceAccountEmail),
  //         );
  //     } else if (projUser.linkedGoogleAccount !== proj.owner) {
  //       // If the project user is linked, but not to project owner,
  //       // unlink user, then link to project owner and delete service account
  //       await module.exports.unlinkGoogleAcct(projUser)
  //         .then(() =>
  //         guppyTasks.forceLinkGoogleAcct(projUser, proj.owner),
  //         )
  //         .then(() =>
  //         guppyTasks.deleteGoogleServiceAccount(projUser, proj.serviceAccountEmail),
  //         );
  //     } else {
  //       // If project user is linked to the project owner, delete the service account
  //       await guppyTasks.deleteGoogleServiceAccount(projUser, proj.serviceAccountEmail);
  //     }
  //   }

  //   // unlink all google accounts
  //   const unlinkPromises = Object.values(users).map(user => guppyTasks.unlinkGoogleAcct(user));
  //   await Promise.all(unlinkPromises);
  // },
};
