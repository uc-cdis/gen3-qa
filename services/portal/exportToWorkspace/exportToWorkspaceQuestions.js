const chai = require('chai');
const exportToWorkspaceProps = require('./exportToWorkspaceProps.js');

const { expect } = chai;
const I = actor();

/**
 * exportToWorkspace Questions
 */
module.exports = {
  async isManifestSavedToWorkspaceSucceeded() {
    console.log('check for the success message toaster');
    const result = await I.grabTextFrom(exportToWorkspaceProps.exportToWorkspaceToasterClass);
    expect(result).to.contain(exportToWorkspaceProps.succeededToasterMessage);
  },

  async isManifestSaveToWorkspaceFailed() {
    console.log('check for the failed message toaster');
    const result = await I.grabTextFrom(exportToWorkspaceProps.exportToWorkspaceToasterClass);
    expect(result).to.contain(exportToWorkspaceProps.failedToasterMessage);
  },

  doesSucceededMessageToasterLookCorrect() {
    console.log('validate the success message toaster format');
    I.seeElement(exportToWorkspaceProps.exportToWorkspaceToasterClass);
    I.seeElement(exportToWorkspaceProps.goToWorkspaceButtonXPath);
    I.seeElement(exportToWorkspaceProps.closeButtonXPath);
  },

  doesFailedMessageToasterLookCorrect() {
    console.log('validate the failed message toaster format');
    I.seeElement(exportToWorkspaceProps.exportToWorkspaceToasterClass);
    I.dontSeeElement(exportToWorkspaceProps.goToWorkspaceButtonXPath);
    I.seeElement(exportToWorkspaceProps.closeButtonXPath);
  },

  async doesMountOutputLookSuccessful(mountOutput, manifestFilename) {
    console.log('verify the mounted file has the same filename as the exported manifest file');
    expect(mountOutput).to.contain(exportToWorkspaceProps.mountManifestSuccessfulMessage);
    expect(mountOutput).to.contain(manifestFilename);
  },
};
