const chai = require('chai');

const expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const sheepdogProps = require('./sheepdogProps.js');
const api_helper = require('../api_helper.js');

/**
 * Internal Helpers
 */
const _resultSuccess = res => {
  expect(res).to.deep.include(sheepdogProps.resultSuccess);
};

const _resultFail = res => {
  expect(res).to.deep.include(sheepdogProps.resultFail);
};

/**
 * Sheepdog Questions
 */
module.exports = {
  addNodeSuccess(node) {
    expect(node).to.have.property('add_res');
    _resultSuccess(node.add_res);
    expect(node.add_res).to.have.property('created_entity_count', 1);
  },

  deleteNodeSuccess(node) {
    expect(node).to.have.property('delete_res');
    _resultSuccess(node.delete_res);
    expect(node.delete_res).to.have.property('deleted_entity_count', 1);
  },

  updateNodeSuccess(node) {
    expect(node).to.have.property('add_res');
    _resultSuccess(node.add_res);
    expect(node.add_res).to.have.property('updated_entity_count', 1);
  },

  addNodesSuccess(node_list) {
    api_helper.applyQuestion(node_list, this.addNodeSuccess);
  },

  deleteNodesSuccess(node_list) {
    api_helper.applyQuestion(node_list, this.deleteNodeSuccess);
  },

  hasEntityError(res, error_type) {
    const expected_prop = {};
    expected_prop[sheepdogProps.resLocators.entityErrorType] = error_type;
    expect(res).to.nested.include(expected_prop);
  },

  hasInternalServerError(res) {
    expect(sheepdogProps.internalServerErrorMsg).to.be.oneOf(
      res.transactional_errors,
    );
  },
};
