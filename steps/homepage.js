'use strict';

module.exports.load = function(url) {
  this.amOnPage(url);
  this.waitForText('cdis.autotest@gmail.com', 60);
};
