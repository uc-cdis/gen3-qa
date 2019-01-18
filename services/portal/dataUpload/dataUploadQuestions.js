let chai = require('chai');
let expect = chai.expect;
// chai.config.includeStack = true;
// chai.config.truncateThreshold = 0;
const I = actor();

const dataUploadProps = require('./dataUploadProps.js');
const portal = require('../../../utils/portal.js');
const util = require('util');

/**
 * dataUpload Questions
 */
module.exports = {
  async isNumberAndSizeOfUnmappedFilesCorrect(count, size) {
    const expectString = util.format(dataUploadProps.unmappedFilesStringFormat, count, size);
    portal.seeProp({locator: {text: expectString}});
  },

  canSeeAllUnmappedFilesOnPage(unmappedFiles) {
    for (let i = 0; i < unmappedFiles.length; i ++) {
      portal.seeProp({locator: {text: unmappedFiles[i]}});
    }
  },

  isSuccessfullySubmitted() {

  },

  cannotSeeUnmappedFilesOnPage(unexpectedFileNames) {
    for (let i = 0; i < unexpectedFileNames.length; i ++) {
      I.dontSee(unexpectedFileNames[i], dataUploadProps.unmappedFileRowClass);
    }
  },
};

