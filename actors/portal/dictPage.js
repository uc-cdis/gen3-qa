let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

let util = require('../../steps/utilSteps');
const I = actor();

const homePage = require('./homePage.js');
const fragments = require('./fragments.js');

/**
 * Dictionary Page Actor
 * @type {{}}
 */
module.exports = {
  /**
   * Tasks
   */
  goTo() {
    // load the homepage, then navigate to the dictionary page
    homePage.goTo();
    fragments.navbar.click('Dictionary');
  },

  showGraph() {
    I.click('Explore')
  },

  /**
   * Questions
   */
  seeLoaded() {
    I.waitForText('Data Dictionary Viewer', 10);
  },

  seeGraph() {
    I.waitForText('Categories', 5);
    I.waitForText('Program', 5);
    I.waitForText('Project', 5);
  }
};