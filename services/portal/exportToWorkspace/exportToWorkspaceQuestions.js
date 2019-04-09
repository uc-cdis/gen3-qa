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
    expect(result).to.contain(exportToWorkspaceProps.succeededToasterMessage);
    return true;
  },

  async isManifestSaveToWorkspaceFailed() {
    const result = await I.grabTextFrom(exportToWorkspaceProps.exportToWorkspaceFooterClass);
    expect(result).to.contain(exportToWorkspaceProps.failedToasterMessage);
    return true;
  },

  doesSucceededMessageToasterLookCorrect() {
    I.seeElement(exportToWorkspaceProps.exportToWorkspaceFooterClass);
    I.seeElement(exportToWorkspaceProps.exportToWorkspaceButtonXPath);
    I.seeElement(exportToWorkspaceProps.closeButtonXPath);
  },

  doesFailedMessageToasterLookCorrect() {
    I.seeElement(exportToWorkspaceProps.exportToWorkspaceFooterClass);
    I.dontSeeElement(exportToWorkspaceProps.exportToWorkspaceButtonXPath);
    I.seeElement(exportToWorkspaceProps.closeButtonXPath);
  },

  async doesMountOutputLookSuccessful(mountOutput, manifestFilename) {
    expect(mountOutput).to.contain(exportToWorkspaceProps.mountManifestSuccessfulMessage);
    expect(mountOutput).to.contain(manifestFilename);
    return true;
  },
};

