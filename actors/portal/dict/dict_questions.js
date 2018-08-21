

const chai = require('chai');

const expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const dict_props = require('./dict_props.js');

const I = actor();

/**
 * Sheepdog Questions
 */
module.exports = {
  seeTables(num) {
    I.seeNumberOfElements(dict_props.tables.locators.css, num);
  },
};
