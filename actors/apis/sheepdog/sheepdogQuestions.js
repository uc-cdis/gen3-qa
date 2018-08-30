const chai = require('chai');

const expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const sheepdogProps = require('./sheepdogProps.js');
const apiHelper = require('../apiHelper.js');

/**
 * Internal Helpers
 */
const resultSuccess = function (res) {
  expect(res).to.deep.include(sheepdogProps.resultSuccess);
};

/**
 * Sheepdog Questions
 */
module.exports = {
  addNodeSuccess(node) {
    expect(node).to.have.property('add_res');
    resultSuccess(node.add_res);
    expect(node.add_res).to.have.property('created_entity_count', 1);
  },

  deleteNodeSuccess(node) {
    expect(node).to.have.property('delete_res');
    resultSuccess(node.delete_res);
    expect(node.delete_res).to.have.property('deleted_entity_count', 1);
  },

  updateNodeSuccess(node) {
    expect(node).to.have.property('add_res');
    resultSuccess(node.add_res);
    expect(node.add_res).to.have.property('updated_entity_count', 1);
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
    expect(sheepdogProps.internalServerErrorMsg).to.be.oneOf(
      res.transactional_errors,
    );
  },
};
