const chai = require('chai');

const expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const fenceQuestions = require('./fenceQuestions.js');
const fenceTasks = require('./fenceTasks.js');

/**
 * fence sequences
 */
module.exports = {
  async checkFileEquals(signedUrlRes, contents) {
    fenceQuestions.hasUrl(signedUrlRes);
    const fileContents = await fenceTasks.getFile(signedUrlRes.body.url);
    expect(fileContents).to.equal(contents);
  },

  async linkGoogleAcct(userAcct, acctWithGoogleCreds) {
    const linkRes = await fenceTasks.linkGoogleAcct(userAcct, acctWithGoogleCreds);
    fenceQuestions.linkSuccess(linkRes, acctWithGoogleCreds);
    return linkRes;
  },

  async unlinkGoogleAcct(userAcct) {
    const unlinkRes = await fenceTasks.unlinkGoogleAcct(userAcct);
    fenceQuestions.unlinkSuccess(unlinkRes);
  },

  async getProjectMembers(projectName) {
    const members = await fenceTasks.getProjectMembers(projectName);
    expect(members).to.not.have.property('error');
    return members;
  },

  async createAPIKey(scope, accessTokenHeaders) {
    const apiKeyRes = await fenceTasks.createAPIKey(scope, accessTokenHeaders);
    fenceQuestions.hasAPIKey(apiKeyRes);
    return apiKeyRes;
  },
};
