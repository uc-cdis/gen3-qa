const chai = require('chai');

const expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const apiUtil = require('../../../utils/apiUtil.js');

/**
 * peregrine utils
 */
const resultSuccess = function (res) {
  expect(res).to.have.property('data');
  expect(res).to.not.have.property('errors');
};

/**
 * peregrine Questions
 */
const hasField = (res, field) => {
  resultSuccess(res);
  expect(res).to.have.nested.property(`data.${field}`);
};

module.exports = {
  hasField,

  hasFieldCount(res, field, count) {
    this.hasField(res, field);
    expect(res.data[field]).to.have.lengthOf(count);
  },

  hasError(res, error) {
    expect(res).to.nested.include({ 'errors[0]': error });
  },

  queryResultEqualsNode(result, node) {
    hasField(result, node.name);
    const nodeData = node.data; // grab data from node
    const queryResult = result.data[node.name][0]; // grab query response data

    // exect the original data to equal our query result
    expect(nodeData).to.deep.include(queryResult);
  },

  queryResultsEqualNodes(results, nodesList) {
    const resultNodeList = nodesList.map(node => [results[node.name], node]);
    apiUtil.applyQuestion(
      resultNodeList,
      this.queryResultEqualsNode,
      true,
    );
  },

  queryResultsSuccess(resultsList) {
    apiUtil.applyQuestion(resultsList, resultSuccess);
  },

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

  allCountsIncrease(previousCounts, newCounts) {
    // assert that the count for each node increased by 1
    // previousCounts and newCounts are objects with results keyed by the node name
    const resultsMergedList = Object.keys(previousCounts).map(nodeName => [
      nodeName,
      previousCounts[nodeName],
      newCounts[nodeName],
    ]);
    apiUtil.applyQuestion(resultsMergedList, this.nodeCountIncrease, true);
  },
};
