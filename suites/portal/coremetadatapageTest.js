'use strict';

Feature('Core Metadata');

Scenario('test core metadata', function* (I) {

  I.loadFiles();

  var fileNames = yield I.grabTextFrom('//tr/td[2]');
  I.clickAFile(fileNames)

  // TODO: enable when the core metadata page loads for all files
  // I.loadCoreMetadata();

});
