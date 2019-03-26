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
  // isNumberAndSizeOfUnmappedFilesCorrect(count, size) {
  //   const expectString = util.format(exportToWorkspaceProps.unmappedFilesStringFormat, count, size);
  //   I.waitForText(expectString, 5);
  // },

  // canSeeAllUnmappedFilesOnPage(unmappedFiles) {
  //   for (let i = 0; i < unmappedFiles.length; i ++) {
  //     I.waitForText(unmappedFiles[i], 5);
  //   }
  // },

  async isManifestSavedToWorkspaceSucceeded() {
    const result = await I.grabTextFrom('.map-data-model__submission-footer');
    const expectString = 'Your cohort has been saved!';
    expect(result).to.contain(expectString);
  },

  async isManifestSaveToWorkspaceFailed() {
    const result = await I.grabTextFrom('.map-data-model__submission-footer');
    const expectString = 'There was an error exporting your cohort.';
    expect(result).to.contain(expectString);
  },

  async cannotSeeUnmappedFilesOnPage(unexpectedFileNames) {
    const numberRows = await I.grabNumberOfVisibleElements(exportToWorkspaceProps.unmappedFileRowClass);
    if (numberRows === 0) return;
    for (let i = 0; i < unexpectedFileNames.length; i ++) {
      I.dontSee(unexpectedFileNames[i], exportToWorkspaceProps.unmappedFileRowClass);
    }
  },
};

