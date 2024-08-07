/**
 * Explorer Page Properties
 */
module.exports = {
  path: 'indexing',
  readyCue: { css: '.indexing-page' },
  formIndexFiles: { css: '.index-flow-form' },
  btnIndexFiles: { xpath: 'xpath: //button[contains(text(), \'Index Files\')]' },
  labelDone: { xpath: '//b[text()="Status"]/following-sibling::span[text()="Done"]' },
  btnClosePopup: { css: '.popup__close-button' },
};
