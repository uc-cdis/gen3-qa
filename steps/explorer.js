'use strict';

module.exports.openDataExplorer = async function() {
  this.amOnPage('/explorer');
  await this.waitForElement('.data-explorer', 10);
}

