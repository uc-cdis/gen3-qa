/**
 * Sheepdog Questions
 * @module sheepdogQuestions
 */

const chai = require('chai');
const sheepdogProps = require('./sheepdogProps.js');
const apiHelper = require('../apiHelper.js');

const expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;
chai.use(apiHelper.gen3Res);

module.exports = {
  addNodeSuccess(node) {
    expect(node.addRes).to.be.a.gen3Res(sheepdogProps.resAddSuccess);
  },

  deleteNodeSuccess(node) {
    expect(node.deleteRes).to.be.a.gen3Res(sheepdogProps.resDeleteSuccess);
  },

  updateNodeSuccess(node) {
    expect(node.addRes).to.be.a.gen3Res(sheepdogProps.resUpdateSuccess);
  },

  addNodesSuccess(nodeList) {
    apiHelper.applyQuestion(nodeList, this.addNodeSuccess);
  },

  deleteNodesSuccess(nodeList) {
    apiHelper.applyQuestion(nodeList, this.deleteNodeSuccess);
  },

  hasEntityError(res, errorType) {
    const expectedProp = {};
    expectedProp[sheepdogProps.resLocators.entityErrorType] = errorType;
    expect(res).to.nested.include(expectedProp);
  },

  hasInternalServerError(res) {
    expect(res).to.have.nested.property('body.transactional_errors');
    expect(sheepdogProps.internalServerErrorMsg).to.be.oneOf(
      res.body.transactional_errors,
    );
  },

  hasNoAuthError(res) {
    expect(res).to.be.a.gen3Res(sheepdogProps.resNoAuth);
  },
};
