'use strict';

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let expect = chai.expect;


module.exports.seeGraphQLPass = function(res) {
  expect(res).to.have.property('data');
  expect(res).to.not.have.property('errors');
};


module.exports.seeAllGraphQLPass = function(results) {
  let fail_list = [];

  Object.values(results).forEach((res) => {
    try {
      this.seeGraphQLPass(res);
    } catch(e) {
      fail_list.push(e);
    }
  });

  expect(fail_list).to.have.lengthOf(0);
};


module.exports.seeGraphQLHasField = function(res, entity_name) {
  this.seeGraphQLPass(res);
  expect(res.data).to.have.property(entity_name);
};


module.exports.seeNumberOfGraphQLField = function(res, entity_name, count) {
  this.seeGraphQLHasField(res, entity_name);
  expect(res.data[entity_name]).to.have.lengthOf(count);
};


module.exports.seeGraphQLFail = function(res) {
  expect(res).to.have.property('errors');
};


module.exports.seeGraphQLHasError = function(res, error) {
  this.seeGraphQLFail(res);
  expect(res.errors).to.have.lengthOf.above(0);
  expect(res.errors[0]).to.equal(error);
};


module.exports.seeGraphQLNodeEqual = function(node, result, node_name) {
  this.seeGraphQLHasField(result, node_name);
  let node_data = node.data; // grab data from node
  let q_res = result.data[node_name][0]; // grab query response data
  let fail_list = [];
  let fields_compared = 0;

  Object.keys(node_data).forEach((field) => {
    try {
      if (node_data.hasOwnProperty(field) && q_res.hasOwnProperty(field)) {
        ++fields_compared;
        expect(node_data[field]).to.equal(q_res[field]);
      }
    } catch(e) {
      fail_list.push(e)
    }
  });

  expect(fields_compared).to.be.above(0, 'failed to compare node to result: all fields were different');
  expect(fail_list).to.have.lengthOf(0);
};


module.exports.seeAllGraphQLNodesEqual = function(nodes, results) {
  let fail_list = [];

  for (let node_name of Object.keys(nodes)) {
    try {
      this.seeGraphQLNodeEqual(nodes[node_name], results[node_name], node_name)
    } catch(e) {
      fail_list.push(e);
    }
  }

  expect(fail_list).to.have.lengthOf(0);
};

module.exports.seeGraphQLNodeCountIncrease = function(previous_res, new_res, node_name) {
  this.seeGraphQLPass(previous_res);
  this.seeGraphQLPass(new_res);

  let count_name = `_${node_name}_count`;

  expect(previous_res.data).to.have.property(count_name);
  expect(new_res.data).to.have.property(count_name, previous_res.data[count_name] + 1);
};


module.exports.seeAllGraphQLNodeCountIncrease = function(previous_count, new_count) {
  let fail_list = [];

  Object.keys(previous_count).forEach((type_name) => {
    try {
      this.seeGraphQLNodeCountIncrease(previous_count[type_name], new_count[type_name], type_name);
    } catch(e) {
      fail_list.push(e);
    }
  });

  expect(fail_list).to.have.lengthOf(0);
};