/**
 * Sheepdog Questions
 * @module sheepdogQuestions
 */

const chai = require('chai');
const sheepdogProps = require('./sheepdogProps.js');
const apiUtil = require('../../../utils/apiUtil.js');

const { expect } = chai;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;
chai.use(apiUtil.gen3Res);

module.exports = {
  /**
   * Asserts a node was submitted to sheepdog successfully
   * @param {Node} node
   */
  addNodeSuccess(node, message = '', allowUpdate=false) {
    const copy = { ...node, addRes: null };
    const msg = `${message} - adding node ${JSON.stringify(copy, null, '  ')}`;
    try {
      expect(node.addRes, msg).to.be.a.gen3Res(sheepdogProps.resAddSuccess);
    } catch (originalError) {
      if (allowUpdate) {
        console.log('Node creation check failed, but updates are allowed: check if successful update');
        try {
          expect(node.addRes, msg).to.be.a.gen3Res(sheepdogProps.resUpdateSuccess);
        } catch {
          throw originalError;
        }
      } else {
        throw originalError;
      }
    }
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
  updateNodeSuccess(node, message = '') {
    const copy = { ...node, addRes: null };
    expect(node.addRes, `${message} - updating node ${JSON.stringify(copy, null, '  ')}`).to.be.a.gen3Res(sheepdogProps.resUpdateSuccess);
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
   * Asserts sheepdog response has status
   * @param {Gen3Response} res
   * @param {int} status HTTP response code
   * @param {string} msg Message to display in case of failure
   */
  hasStatusCode(res, status, msg = '') {
    err = `Wrong status code: ${msg}`;
    expect(res && res.status, err).to.equal(status);
  },

  /**
   * Asserts sheepdog response has an internal server error
   * @param {Gen3Response} res
   */
  hasInternalServerError(res) {
    expect(res).to.have.nested.property('data.transactional_errors');
    expect(sheepdogProps.internalServerErrorMsg).to.be.oneOf(
      res.data.transactional_errors,
    );
  },

  /**
   * Asserts a sheepdog response has error due to missing authentication
   * @param {Gen3Response} res
   */
  hasExpiredAuthError(res) {
    expect(res).to.be.a.gen3Res;
    expect(res.status).to.equal(sheepdogProps.resExpiredAuth.status);
    // Before sheepdog's arborist update, the error is in body.message
    // After sheepdog's arborist update, the error is in body.error
    const msg = res.body.error || res.body.message;
    expect(msg).to.contain(sheepdogProps.resExpiredAuth.errorMsg);
  },
};
