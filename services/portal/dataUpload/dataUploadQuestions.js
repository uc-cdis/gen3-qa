const chai = require('chai');

const { expect } = chai;
const I = actor();

const util = require('util');
const dataUploadProps = require('./dataUploadProps.js');
const portal = require('../../../utils/portal.js');

/**
 * dataUpload Questions
 */
module.exports = {
  isNumberAndSizeOfUnmappedFilesCorrect(count, size) {
    const expectString = util.format(dataUploadProps.unmappedFilesStringFormat, count, size);
    I.waitForText(expectString, 5);
  },

  canSeeAllUnmappedFilesOnPage(unmappedFiles) {
    for (let i = 0; i < unmappedFiles.length; i++) {
      I.waitForText(unmappedFiles[i], 5);
    }
  },

  async isSuccessfullySubmitted(fileCount) {
    const result = await I.grabTextFrom('.map-files__notification-wrapper');
    const expectString = util.format(dataUploadProps.successMessageFormate, fileCount);
    expect(result).to.equal(expectString);
  },

  async cannotSeeUnmappedFilesOnPage(unexpectedFileNames) {
    const numberRows = await I.grabNumberOfVisibleElements(dataUploadProps.unmappedFileRowClass);
    if (numberRows === 0) return;
    for (let i = 0; i < unexpectedFileNames.length; i++) {
      I.dontSee(unexpectedFileNames[i], dataUploadProps.unmappedFileRowClass);
    }
  },
};
