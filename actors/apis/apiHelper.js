const chai = require('chai');

const expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

module.exports = {
  applyQuestion(obj_list, question, spread) {
    // call the question on each object in the list, catching and appending any thrown AssertionErrors
    // Finally, assert there should be no assertion errors in the list
    // Multiple arguments can be passed to the callback by putting them in an array, then calling with arg spread as true
    const fail_list = [];

    for (const this_obj of obj_list) {
      try {
        if (spread) {
          question(...this_obj);
        } else {
          question(this_obj);
        }
      } catch (e) {
        fail_list.push(e.message);
      }
    }

    expect(fail_list).to.deep.equal([]);
  },
};
