/**
 * Sheepdog Questions
 * @module sheepdogQuestions
 */

const chai = require('chai');
const sheepdogProps = require('./sheepdogProps.js');
const apiUtil = require('../../../utils/apiUtil.js');

const expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;
chai.use(apiUtil.gen3Res);

module.exports = {
  /**
   * Asserts a node was submitted to sheepdog successfully
   * @param {Node} node
   */
  addNodeSuccess(node) {
    expect(node.addRes).to.be.a.gen3Res(sheepdogProps.resAddSuccess);
  },

  /**
   * Asserts a node was deleted from sheepdog successfully
   * @param {Node} node
   */
  deleteNodeSuccess(node) {
    expect(node.deleteRes).to.be.a.gen3Res(sheepdogProps.resDeleteSuccess);
  },

  /**
   * Asserts a node was updated in sheepdog successfully
   * @param {Node} node
   */
  updateNodeSuccess(node) {
    expect(node.addRes).to.be.a.gen3Res(sheepdogProps.resUpdateSuccess);
  },

  /**
   * Asserts all nodes in an array were submitted to sheepdog successfully
   * @param {Node[]} nodeList
   */
  addNodesSuccess(nodeList) {
    apiUtil.applyQuestion(nodeList, this.addNodeSuccess);
  },

  /**
   * Asserts all nodes in an array were deleted from sheepdog successfully
   * @param nodeList
   */
  deleteNodesSuccess(nodeList) {
    apiUtil.applyQuestion(nodeList, this.deleteNodeSuccess);
  },

  /**
   * Asserts sheepdog response has given entity error
   * @param {Gen3Response} res
   * @param {string} errorType
   */
  hasEntityError(res, errorType) {
    const expectedProp = {};
    expectedProp[sheepdogProps.resLocators.entityErrorType] = errorType;
    expect(res).to.nested.include(expectedProp);
  },

  /**
   * Asserts sheepdog response has an internal server error
   * @param {Gen3Response} res
   */
  hasInternalServerError(res) {
    expect(res).to.have.nested.property('body.transactional_errors');
    expect(sheepdogProps.internalServerErrorMsg).to.be.oneOf(
      res.body.transactional_errors,
    );
  },

  /**
   * Asserts a sheepdog response has error due to missing authentication
   * @param {Gen3Response} res
   */
  hasNoAuthError(res) {
    expect(res).to.be.a.gen3Res(sheepdogProps.resNoAuth);
  },
};
