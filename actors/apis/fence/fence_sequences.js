const chai = require('chai');

const expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const fence_questions = require('./fence_questions.js');
const fence_tasks = require('./fence_tasks.js');

/**
 * fence sequences
 */
module.exports = {
  async checkFileEquals(signed_url_res, contents) {
    fence_questions.hasUrl(signed_url_res);
    const file_contents = await fence_tasks.getFile(signed_url_res.body.url);
    expect(file_contents).to.equal(contents);
  },

  async linkGoogleAcct(userAcct, acctWithGoogleCreds) {
    const linkRes = await fence_tasks.linkGoogleAcct(userAcct, acctWithGoogleCreds);
    fence_questions.linkSuccess(linkRes, acctWithGoogleCreds);
    return linkRes;
  },

  async unlinkGoogleAcct(userAcct) {
    const unlinkRes = await fence_tasks.unlinkGoogleAcct(userAcct);
    fence_questions.unlinkSuccess(unlinkRes);
  },

  async getProjectMembers(projectName) {
    const members = await fence_tasks.getProjectMembers(projectName);
    expect(members).to.not.have.property('error');
    return members;
  },
};
