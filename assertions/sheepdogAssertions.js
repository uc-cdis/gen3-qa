'use strict';

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let expect = chai.expect;

const hasEntity = function(res) {
  expect(res).to.have.nested.property('entities[0]')
};


module.exports.seeNodePass = function(res) {
  expect(res).to.have.property('success', true, JSON.stringify(res));
  expect(res).to.have.property('entity_error_count', 0, JSON.stringify(res));
  expect(res).to.have.property('transactional_error_count', 0, JSON.stringify(res));
};


module.exports.seeNodeAddSuccess = function(node) {
  this.seeNodePass(node.add_res);
  expect(node.add_res).to.have.property('created_entity_count', 1, JSON.stringify(node.add_res));
};


module.exports.seeNodeDeleteSuccess = function(node) {
  this.seeNodePass(node.delete_res);
  expect(node.delete_res).to.have.property('deleted_entity_count', 1, JSON.stringify(node.delete_res));
};


module.exports.seeNodeUpdateSuccess = function(node) {
  this.seeNodePass(node.add_res);
  expect(node.add_res).to.have.property('updated_entity_count', 1, JSON.stringify(node.add_res));
};


module.exports.seeAllNodesAddSuccess = function(node_list) {
  let fail_list = [];

  for (let node of node_list) {
    try {
      this.seeNodeAddSuccess(node);
    } catch (e) {
      fail_list.push(e.message);
    }
  }

  expect(fail_list).to.deep.equal([])
};


module.exports.seeAllNodesDeleteSuccess = function(node_list) {
  let fail_list = [];

  for (let node of node_list) {
    try {
      this.seeNodeDeleteSuccess(node)
    } catch (e) {
      fail_list.push(e.message);
    }
  }

  expect(fail_list).to.deep.equal([])
};


module.exports.seeSheepdogHasEntityError = function(res, error_type) {
  hasEntity(res);
  let entity = res.entities[0];
  expect(entity).to.nested.include({'errors[0].type': error_type});
};


module.exports.seeSheepdogHasTransactionalError = function(res, error) {
  expect(error).to.be.oneOf(res.transactional_errors);
};
