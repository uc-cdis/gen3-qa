const explorerProps = require('./explorerProps.js');

const I = actor();
/**
 * explorer Questions
 */
module.exports = {
  isPageLoaded(){
    //I.waitForElement(explorerProps.ready_cue.locator, 10);
    I.waitUrlEquals('/explorer', 10);
  }

  // FROM ORIGINAL EXPLORER QUESTIONS
  // module.exports.seeVisualizations = function () {
  //   this.seeElement('.data-explorer__visualizations');
  // };
  //
  // module.exports.seeSQON = function() {
  //   this.seeElement('.sqon-view')
  // }
  //
  // module.exports.seeSQONLabelsCountCorrect = function(n) {
  //   this.waitNumberOfVisibleElements('.sqon-value', n, 10);
  // }
  //
  // module.exports.dontSeeSQON = function() {
  //   this.dontSeeElement('.sqon-view');
  // }
  //
  // module.exports.seeArrangerReturnedCorrectly = function(res) {
  //   assert.equal(res.status, 200);
  //   assert(res.body);
  // }
};
