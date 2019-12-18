const chai = require('chai');

const { expect } = chai;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const apiUtil = require('../../../utils/apiUtil.js');

/**
 * internal utils
 */
const resultSuccess = function (res) {
  expect(res).to.have.property('data');
  expect(res).to.not.have.property('errors');
};

/**
 * peregrine Questions
 */

/**
 * Asserts that res was successful and contains a given field
 * @param {Object} res
 * @param {string} field
 */
const hasField = (res, field) => {
  resultSuccess(res);
  expect(res).to.have.nested.property(`data.${field}`);
};

module.exports = {
  resultSuccess,
  hasField,

  /**
   * Asserts response has a field of given length
   * @param {Object} res
   * @param {string} field
   * @param {number} count
   */
  hasFieldCount(res, field, count) {
    this.hasField(res, field);
    expect(res.data[field]).to.have.lengthOf(count);
  },

  /**
   * Asserts response has given error
   * @param {Object} res
   * @param {string} error
   */
  hasError(res, error) {
    expect(res).to.nested.include({ 'errors[0]': error });
  },

  /**
   * Asserts a node graphQL query matches node data
   * @param {Object} result - response from graphql
   * @param {Node} node - expected node data
   */
  queryResultEqualsNode(result, node) {
    hasField(result, node.name);
    const nodeData = node.data; // grab data from node
    const queryResult = result.data[node.name][0]; // grab query response data

    // exect the original data to equal our query result
    expect(nodeData).to.deep.include(queryResult);
  },

  /**
   * Asserts array of results matches array of node data
   * @param {Object[]} results - array of responses from graphql
   * @param {Node[]} nodesList - array of expected nodes
   */
  queryResultsEqualNodes(results, nodesList) {
    const resultNodeList = nodesList.map((node) => [results[node.name], node]);
    apiUtil.applyQuestion(
      resultNodeList,
      this.queryResultEqualsNode,
      true,
    );
  },

  /**
   * Asserts a graphQL count result increased by 1
   * @param {string} nodeName - name of the node which count filter was applied to
   * @param {Object} previousResult - graphQL response
   * @param {Object} newResult - graphQL response, expect count to be previous +1
   */
  nodeCountIncrease(nodeName, previousResult, newResult) {
    resultSuccess(previousResult);
    resultSuccess(newResult);

    const countName = `_${nodeName}_count`;
    expect(previousResult).to.have.nested.property(`data.${countName}`);
    const previousCount = previousResult.data[countName];

    expect(newResult).to.nested.include({
      [`data.${countName}`]: previousCount + 1,
    });
  },

  /**
   * Asserts an array of graphQL count results increase by 1
   * @param {Object[]} previousCounts - array of first count responses
   * @param {Object[]} newCounts - array of second count responses, expect could to be +1
   */
  allCountsIncrease(previousCounts, newCounts) {
    // assert that the count for each node increased by 1
    // previousCounts and newCounts are objects with results keyed by the node name
    const resultsMergedList = Object.keys(previousCounts).map((nodeName) => [
      nodeName,
      previousCounts[nodeName],
      newCounts[nodeName],
    ]);
    apiUtil.applyQuestion(resultsMergedList, this.nodeCountIncrease, true);
  },
};
