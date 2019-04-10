const exportToWorkspaceQuestions = require('./exportToWorkspaceQuestions.js');
const exportToWorkspaceTasks = require('./exportToWorkspaceTasks.js');

const I = actor();

/**
 * exportToWorkspace Sequences
 */
module.exports = {
  /* The 'Export default manifest, mount it and check manifest filename' test sequence */
  async checkExportDefaultManifestToWorkspace(exportToWorkspaceUtil) {
    exportToWorkspaceTasks.exportDefaultManifestToWorkspace();
    exportToWorkspaceQuestions.isManifestSavedToWorkspaceSucceeded();
    const manifestFilename = await exportToWorkspaceTasks.grabManifestFilename();
    exportToWorkspaceTasks.jumpToWorkspacePage();
    exportToWorkspaceTasks.startWorkspace();
    const mountOutput = await exportToWorkspaceTasks.mountLatestManifestInJupyterNotebook(exportToWorkspaceUtil);
    await exportToWorkspaceQuestions.doesMountOutputLookSuccessful(mountOutput, manifestFilename);
    await exportToWorkspaceTasks.backToWorkspace(exportToWorkspaceUtil);
    I.wait(3); // wait for dialog to appear
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
