const exportToWorkspaceProps = require('./exportToWorkspaceProps.js');
const chai = require('chai');

const expect = chai.expect;
const I = actor();

/**
 * exportToWorkspace Questions
 */
module.exports = {
  async isManifestSavedToWorkspaceSucceeded() {
    const result = await I.grabTextFrom(exportToWorkspaceProps.exportToWorkspaceFooterClass);
    const expectString = 'Your cohort has been saved!';
    expect(result).to.contain(expectString);
  },

  async isManifestSaveToWorkspaceFailed() {
    const result = await I.grabTextFrom(exportToWorkspaceProps.exportToWorkspaceFooterClass);
    const expectString = 'There was an error exporting your cohort.';
    expect(result).to.contain(expectString);
  },
};

