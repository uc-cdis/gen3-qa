const exportToWorkspaceQuestions = require('./exportToWorkspaceQuestions.js');
const exportToWorkspaceTasks = require('./exportToWorkspaceTasks.js');

const I = actor();

/**
 * exportToWorkspace Sequences
 */
module.exports = {
  /* The 'Export default manifest, mount it and check manifest filename' test sequence */
  async checkExportDefaultManifestToWorkspace() {
    await exportToWorkspaceTasks.exportDefaultManifestToWorkspace();
    exportToWorkspaceQuestions.isManifestSavedToWorkspaceSucceeded();
    const manifestName = await exportToWorkspaceTasks.grabManifestName();
    await exportToWorkspaceTasks.jumpToWorkspacePage();
    await exportToWorkspaceTasks.startWorkspace();
    exportToWorkspaceTasks.mountLatestManifestInJupyterNotebook(manifestName);
  },

  /* The 'Click Workspace tab when logged out and logged in' test sequence */
  checkClickWorkspaceTabWithLogoutAndLogin(home) {
    exportToWorkspaceTasks.logoutAndGetToWorkspace(home);
    exportToWorkspaceTasks.loginAndGetToWorkspace(home);
  },

  /* The 'Check export to workspace success message toaster' test sequence */
  async checkMessageToasterSuccess() {
    await exportToWorkspaceTasks.exportDefaultManifestToWorkspace();
    exportToWorkspaceQuestions.isManifestSavedToWorkspaceSucceeded();
    exportToWorkspaceQuestions.doesSucceededMessageToasterLookCorrect();
  },

  /* The 'Check export to workspace failed message toaster' test sequence
  Currently not supported since cannot trigger failed toaster */
  // checkMessageToasterFailed() {
  //   exportToWorkspaceTasks.exportDefaultManifestToWorkspace();
  //   exportToWorkspaceQuestions.isManifestSaveToWorkspaceFailed();
  //   exportToWorkspaceQuestions.doesFailedMessageToasterLookCorrect();
  // },
};
