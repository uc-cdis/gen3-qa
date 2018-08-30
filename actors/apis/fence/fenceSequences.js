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
  async checkFileEquals(signed_url_res, contents) {
    fenceQuestions.hasUrl(signed_url_res);
    const file_contents = await fenceTasks.getFile(signed_url_res.body.url);
    expect(file_contents).to.equal(contents);
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
};
