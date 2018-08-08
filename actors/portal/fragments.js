let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

let util = require('../../steps/utilSteps');
const I = actor();

/**
 * General Page Fragements
 * @type {{}}
 */
const navbar = {
  container: ".sc-jnlKLf",

  async click(selector) {
    await within(this.container, async () => {
      I.click(selector)
    });
  }
};

const footer = {
  container: "some_CSS_selector",

  async see(text) {
    await within(this.container, async () => {
      I.see(text)
    });
  }
};

module.exports = {
  navbar: navbar,
  footer: footer
};