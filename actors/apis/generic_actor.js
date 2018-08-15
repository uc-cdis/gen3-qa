'use strict';

let chai = require('chai');
let expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const tasks = {
  sortNodes(nodes_list) {
    return nodes_list.sort((a, b) => { return a.order - b.order })
  }
};

const questions = {
  applyQuestion(obj_list, question, spread) {
    // call the question on each object in the list, catching and appending any thrown AssertionErrors
    // Finally, assert there should be no assertion errors in the list
    // Multiple arguments can be passed to the callback by putting them in an array, then calling with arg spread as true
    let fail_list = [];

    for (let this_obj of obj_list) {
      try {
        if (spread)
          question(...this_obj);
        else
          question(this_obj)
      } catch (e) {
        fail_list.push(e.message);
      }
    }

    expect(fail_list).to.deep.equal([])
  }
};

module.exports = {
  do: tasks,

  ask: questions
};