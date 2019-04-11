const exportToWorkspaceQuestions = require('./exportToWorkspaceQuestions.js');
const exportToWorkspaceTasks = require('./exportToWorkspaceTasks.js');

const I = actor();

/**
 * exportToWorkspace Sequences
 */
module.exports = {
  /* The 'Export default manifest, mount it and check manifest filename' test sequence */
  async checkExportDefaultManifestToWorkspace() {
    exportToWorkspaceTasks.exportDefaultManifestToWorkspace();
    exportToWorkspaceQuestions.isManifestSavedToWorkspaceSucceeded();
    const manifestFilename = await exportToWorkspaceTasks.grabManifestFilename();
    await exportToWorkspaceTasks.jumpToWorkspacePage();
    await exportToWorkspaceTasks.startWorkspace();
    const mountOutput = await exportToWorkspaceTasks.mountLatestManifestInJupyterNotebook();
    await exportToWorkspaceQuestions.doesMountOutputLookSuccessful(mountOutput, manifestFilename);
    await exportToWorkspaceTasks.backToWorkspace();
    await exportToWorkspaceTasks.deleteAllJupyterNotebooks();
  },

  /* The 'Click Workspace tab when logged out and logged in' test sequence */
  checkClickWorkspaceTabWithLogoutAndLogin(home) {
    exportToWorkspaceTasks.logoutAndGetToWorkspace(home);
    exportToWorkspaceTasks.loginAndGetToWorkspace(home);
  },

  /* The 'Check export to workspace success message toaster' test sequence */
  checkMessageToasterSuccess() {
    exportToWorkspaceTasks.exportDefaultManifestToWorkspace();
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
