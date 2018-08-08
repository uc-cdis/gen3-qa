let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

let util = require('../../steps/utilSteps');
const I = actor();

let fragments = require('./fragments.js');

/**
 * Dictionary Page Actor
 * @type {{}}
 */
module.exports = {
  /**
   * Tasks
   */
  goTo() {
    // load the homepage
    I.amOnPage('');
    I.waitForText('Generic', 60);
  },

  /**
   * Questions
   */
  seeChart() {
    I.see('Chart')
  },

  seeLoggedIn(email) {
    I.see(email)
  }

};