const chai = require('chai');

const { expect } = chai;

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
    const no = index.match(RegExp('.*?([0-9]+)$'));
    expect(Number.parseInt(no[1]), 'Fails to increase function').to.equal(previousVersion + 1);
  },
};
