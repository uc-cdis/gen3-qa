'use strict';

module.exports.load = function(url) {
  this.amOnPage(url);
  this.waitForText('CDIS.AUTOTEST', 60);
};
