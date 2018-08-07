'use strict';

Feature('Core Metadata');

Scenario('test core metadata', function* (I) {

  I.loadFiles();

  var fileNames = yield I.grabTextFrom('//tr/td[2]');
  I.clickAFile(fileNames)

  I.loadCoreMetadata();

});
