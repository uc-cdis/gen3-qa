'use strict';
  
let chai = require('chai');
let expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const peregrine_props = require('./peregrine_props.js');
const generic_actor = require('../generic_actor.js');

/**
 * peregrine helpers
 */
const _resultSuccess = (res) => {
  expect(res).to.have.property('data');
  expect(res).to.not.have.property('errors');
};

const _resultFail = (res) => {
  expect(res).to.have.property('errors');
};

/**
 * peregrine Questions
 */
const hasField = (res, field) => {
  _resultSuccess(res);
  expect(res).to.have.nested.property(`data.${field}`);
};


module.exports = {
  hasField: hasField,

  hasFieldCount(res, field, count) {
    this.hasField(res, field);
    expect(res.data[field]).to.have.lengthOf(count);
  },

  hasError(res, error) {
    expect(res).to.nested.include({'errors[0]': error});
  },

  queryResultEqualsNode(result, node) {
    hasField(result, node.name);
    let node_data = node.data; // grab data from node
    let query_result = result.data[node.name][0]; // grab query response data
    let fail_list = [];
    let fields_compared = 0;

    // Iterate through the node data fields.
    // If the query result also has that field, check that they are equal.
    Object.keys(node_data).forEach((field) => {
      try {
        if (node_data.hasOwnProperty(field) && query_result.hasOwnProperty(field)) {
          ++fields_compared;
          expect(node_data[field]).to.equal(query_result[field]);
        }
      } catch(e) {
        fail_list.push(e.message)
      }
    });

    // Check that we were able to compare at least 1 field
    expect(fields_compared).to.be.above(0, 'Query result and Node had no common fields, no comparison made');
    expect(fail_list).to.deep.equal([]);
  },

  queryResultsEqualNodes(results, nodes_list) {
    let result_node_list = nodes_list.map( node => {
      return [results[node.name], node]
    });
    generic_actor.ask.applyQuestion(result_node_list, this.queryResultEqualsNode, true)
  },

  queryResultsSuccess(results_list) {
    generic_actor.ask.applyQuestion(results_list, _resultSuccess)
  },

  nodeCountIncrease(node_name, previous_result, new_result) {
    _resultSuccess(previous_result);
    _resultSuccess(new_result);

    let count_name = `_${node_name}_count`;
    expect(previous_result).to.have.nested.property(`data.${count_name}`);
    let previous_count = previous_result.data[count_name];

    expect(new_result).to.nested.include({[`data.${count_name}`]: previous_count + 1})
  },

  allCountsIncrease(previous_counts, new_counts) {
    // assert that the count for each node increased by 1
    // previous_counts and new_counts are objects with results keyed by the node name
    let results_merged_list = Object.keys(previous_counts).map( node_name => {
      return [node_name, previous_counts[node_name], new_counts[node_name]]
    });
    generic_actor.ask.applyQuestion(results_merged_list, this.nodeCountIncrease, true)
  }
};

