'use strict';

module.exports.goToFiles = function() {
  this.load('');
  this.click('Files');
};

module.exports.loadFiles = function() {
  this.waitForText('Project', 60);
};

module.exports.clickAFile = function(fileNames) {
  // click on the first file name
  var firstName = fileNames[fileNames.indexOf('File Name') + 1];
  this.click(firstName);
};

module.exports.loadCoreMetadata = function () {
  this.waitForText('More Data Info', 10);
};
