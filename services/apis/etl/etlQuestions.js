const chai = require('chai');
const expect = chai.expect;

/**
 * fence Questions
 */
module.exports = {
  /**
   * Asserts a res has url property
   * @param index
   * @returns {boolean}
   */
  hasVersionIncreased(index, previousVersion) {
    let no = index.match(RegExp('.*?([0-9]+)$'))
    expect(Number.parseInt(no[1])).to.equal(previousVersion + 1);
  },
};
