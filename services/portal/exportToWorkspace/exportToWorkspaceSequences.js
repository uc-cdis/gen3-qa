const exportToWorkspaceQuestions = require('./exportToWorkspaceQuestions.js');
const exportToWorkspaceTasks = require('./exportToWorkspaceTasks.js');
const exportToWorkspaceProps = require('./exportToWorkspaceProps.js');

const I = actor();

/**
 * exportToWorkspace Sequences
 */
module.exports = {
  async checkExportDefaultManifestToWorkspace() {
    exportToWorkspaceTasks.exportDefaultManifestToWorkspace();
    exportToWorkspaceQuestions.isManifestSavedToWorkspaceSucceeded();
    const manifestFilename = await exportToWorkspaceTasks.grabManifestFilename();
    exportToWorkspaceTasks.jumpToWorkspacePage();
    exportToWorkspaceTasks.startWorkspace();
    const mountOutput = await exportToWorkspaceTasks.mountLatestManifestInJupyterNotebook();
    await exportToWorkspaceQuestions.doesMountOutputLookSuccessful(mountOutput, manifestFilename);
    exportToWorkspaceTasks.backToWorkspace();
  },

  checkClickWorkspaceTabWithLogoutAndLogin(home) {
    home.complete.logout();
    I.amOnPage(exportToWorkspaceProps.workspacePath);
    I.seeElement(exportToWorkspaceProps.loginPageClass);
    home.complete.login();
    exportToWorkspaceTasks.goToWorkspacePage();
  },

  checkMessageToaster() {
    exportToWorkspaceTasks.exportDefaultManifestToWorkspace();
    if (exportToWorkspaceQuestions.isManifestSavedToWorkspaceSucceeded()) {
      exportToWorkspaceQuestions.doesSucceededMessageToasterLookCorrect();
    } else if (exportToWorkspaceQuestions.isManifestSaveToWorkspaceFailed()) {
      exportToWorkspaceQuestions.doesFailedMessageToasterLookCorrect();
    }
  },
};
