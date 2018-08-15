let chai = require('chai');
let expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const dict_props = require('./dict_props.js');
let I = actor();

/**
 * Sheepdog Questions
 */
module.exports = {
  seeTables(num) {
    I.seeNumberOfElements(dict_props.tables.locators.css, num);
  }
};