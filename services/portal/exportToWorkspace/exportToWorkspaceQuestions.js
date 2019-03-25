let chai = require('chai');
let expect = chai.expect;
const I = actor();

const exportToWorkspaceProps = require('./exportToWorkspaceProps.js');
const portal = require('../../../utils/portal.js');
const util = require('util');

/**
 * exportToWorkspace Questions
 */
module.exports = {
  isNumberAndSizeOfUnmappedFilesCorrect(count, size) {
    const expectString = util.format(exportToWorkspaceProps.unmappedFilesStringFormat, count, size);
    I.waitForText(expectString, 5);
  },

  canSeeAllUnmappedFilesOnPage(unmappedFiles) {
    for (let i = 0; i < unmappedFiles.length; i ++) {
      I.waitForText(unmappedFiles[i], 5);
    }
  },

  async isSuccessfullySubmitted(fileCount) {
    const result = await I.grabTextFrom('.map-files__notification-wrapper');
    const expectString = util.format(exportToWorkspaceProps.successMessageFormate, fileCount);
    expect(result).to.equal(expectString);
  },

  async cannotSeeUnmappedFilesOnPage(unexpectedFileNames) {
    const numberRows = await I.grabNumberOfVisibleElements(exportToWorkspaceProps.unmappedFileRowClass);
    if (numberRows === 0) return;
    for (let i = 0; i < unexpectedFileNames.length; i ++) {
      I.dontSee(unexpectedFileNames[i], exportToWorkspaceProps.unmappedFileRowClass);
    }
  },
};

