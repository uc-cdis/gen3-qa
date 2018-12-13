/**
 * A module providing general util functions
 * @module util
 */

module.exports = {
  /**
   * Wait for the specified number of milliseconds
   */
   sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
};
