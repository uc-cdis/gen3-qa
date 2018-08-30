const chai = require('chai');

const expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

module.exports = {
  applyQuestion(objList, question, spread) {
    /* All question on each object in the list, catching and appending any thrown AssertionErrors.
      Assert there should be no assertion errors in the list.
      Multiple arguments can be passed to the callback by putting them in an array,
      then calling with arg spread as true. */
    const failList = [];

    for (const thisObj of objList) {
      try {
        if (spread) {
          question(...thisObj);
        } else {
          question(thisObj);
        }
      } catch (e) {
        failList.push(e.message);
      }
    }

    expect(failList).to.deep.equal([]);
  },
};
