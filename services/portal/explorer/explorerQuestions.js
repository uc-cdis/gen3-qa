let chai = require('chai');
let expect = chai.expect;
chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

const explorerProps = require('./explorerProps.js');

/**
 * explorer Questions
 */
module.exports = {
  seeVisualizations() {
    this.seeElement('.data-explorer__visualizations');
  },
  
  seeSQON() {
    this.seeElement('.sqon-view')
  },
  
  seeSQONLabelsCountCorrect(n) {
    this.waitNumberOfVisibleElements('.sqon-value', n, 10);
  },
  
  dontSeeSQON() {
    this.dontSeeElement('.sqon-view');
  },
  
  seeArrangerReturnedCorrectly(res) {
    assert.equal(res.status, 200);
    assert(res.body);
  }
};

