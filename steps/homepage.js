'use strict';

module.exports.load = function(url) {
  this.amOnPage(url);
  this.waitForText('cdis.autotest@gmail.com', 60);
};

module.exports.verifyLink = async function(selector, expected_url) {
  this.pressKey("Command");
  this.click(selector);
  this.pressKey("Command");
  await this.switchToNextTab();
  await this.waitInUrl(expected_url, 5);
  await this.closeCurrentTab();
};