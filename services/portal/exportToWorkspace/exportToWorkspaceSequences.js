const exportToWorkspaceQuestions = require('./exportToWorkspaceQuestions.js');
const exportToWorkspaceTasks = require('./exportToWorkspaceTasks.js');

// const I = actor();

/**
 * exportToWorkspace Sequences
 */
module.exports = {
  /* The 'Click Workspace tab when logged out and logged in' test sequence */
  // async checkClickWorkspaceTabWithLogoutAndLogin(home) {
  //   await exportToWorkspaceTasks.logoutAndGetToWorkspace(home);
  //   await exportToWorkspaceTasks.loginAndGetToWorkspace(home);
  // },

  /* The 'Check export to workspace success message toaster' test sequence */
  async checkMessageToasterSuccess() {
    await exportToWorkspaceTasks.exportDefaultManifestToWorkspace();
    exportToWorkspaceQuestions.isManifestSavedToWorkspaceSucceeded();
    exportToWorkspaceQuestions.doesSucceededMessageToasterLookCorrect();
  },

  // async checkExportDefaultManifestToWorkspaceJupyterHub() {
  //   await exportToWorkspaceTasks.exportDefaultManifestToWorkspace();
  //   exportToWorkspaceQuestions.isManifestSavedToWorkspaceSucceeded();
  //   const manifestName = await exportToWorkspaceTasks.grabManifestName();
  //   await exportToWorkspaceTasks.jumpToWorkspacePage();
  //   await exportToWorkspaceTasks.startWorkspaceJupyterHub();
  //   exportToWorkspaceTasks.mountLatestManifestInJupyterNotebookJupyterHub(manifestName);
  // },

  // /* The 'Export default manifest, mount it and check manifest filename' test sequence */
  // async checkExportDefaultManifestToWorkspaceHatchery() {
  //   await exportToWorkspaceTasks.terminateWorkspaceHatcheryAndExit();
  //   await exportToWorkspaceTasks.exportDefaultManifestToWorkspace();
  //   exportToWorkspaceQuestions.isManifestSavedToWorkspaceSucceeded();
  //   const manifestName = await exportToWorkspaceTasks.grabManifestName();
  //   await exportToWorkspaceTasks.jumpToWorkspacePage();
  //   await exportToWorkspaceTasks.startWorkspaceHatchery();
  //   exportToWorkspaceTasks.mountLatestManifestInJupyterNotebookHatchery(manifestName);
  // },

  /* The 'Check export to workspace failed message toaster' test sequence
  Currently not supported since cannot trigger failed toaster */
  // checkMessageToasterFailed() {
  //   exportToWorkspaceTasks.exportDefaultManifestToWorkspace();
  //   exportToWorkspaceQuestions.isManifestSaveToWorkspaceFailed();
  //   exportToWorkspaceQuestions.doesFailedMessageToasterLookCorrect();
  // },
};
