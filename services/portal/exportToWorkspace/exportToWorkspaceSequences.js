const exportToWorkspaceQuestions = require('./exportToWorkspaceQuestions.js');
const exportToWorkspaceTasks = require('./exportToWorkspaceTasks.js');
const exportToWorkspaceProps = require('./exportToWorkspaceProps.js');

const I = actor();

/**
 * exportToWorkspace Sequences
 */
module.exports = {
  /* The 'Export default manifest, mount it and check manifest name' test sequence, steps are:
    - from 'Explore' page, click 'Export to workspace' button to export default manifest to workspace
    - validate the message toaster and grab the filename of exported manifest file
    - redirect to workspace and spawn a workspace if none exists
    - create a python notebook in workspace and mount the latest manifest using python code
    - verify the mounted file has the same filename as the exported manifest file
    - go back to workspace and delete all Jupyther notebooks for clean up */
  async checkExportDefaultManifestToWorkspace() {
    exportToWorkspaceTasks.exportDefaultManifestToWorkspace();
    exportToWorkspaceQuestions.isManifestSavedToWorkspaceSucceeded();
    const manifestFilename = await exportToWorkspaceTasks.grabManifestFilename();
    exportToWorkspaceTasks.jumpToWorkspacePage();
    exportToWorkspaceTasks.startWorkspace();
    const mountOutput = await exportToWorkspaceTasks.mountLatestManifestInJupyterNotebook();
    await exportToWorkspaceQuestions.doesMountOutputLookSuccessful(mountOutput, manifestFilename);
    await exportToWorkspaceTasks.backToWorkspace();
    I.wait(3); // wait for dialog to appear
    await exportToWorkspaceTasks.deleteAllJupyterNotebooks();
  },

  /* The 'Click Workspace tab when logged out and logged in' test sequence, steps are:
    - Log out current user
    - Click the 'Workspace' tab from top nav bar to try to get to workspace
    - Check if still seeing login page
    - Login as test user
    - Click the 'Workspace' tab from top nav bar again and verify is on workspace page */
  checkClickWorkspaceTabWithLogoutAndLogin(home) {
    home.complete.logout();
    I.amOnPage(exportToWorkspaceProps.workspacePath);
    I.seeElement(exportToWorkspaceProps.loginPageClass);
    home.complete.login();
    exportToWorkspaceTasks.goToWorkspacePage();
  },

  /* The 'Check export to workspace message toaster' test sequence, steps are:
  - from 'Explore' page, click 'Export to workspace' button to export default manifest to workspace
  - validate the format of toaster based on whether the export has succeeded or not */
  checkMessageToaster() {
    exportToWorkspaceTasks.exportDefaultManifestToWorkspace();
    if (exportToWorkspaceQuestions.isManifestSavedToWorkspaceSucceeded()) {
      exportToWorkspaceQuestions.doesSucceededMessageToasterLookCorrect();
    } else if (exportToWorkspaceQuestions.isManifestSaveToWorkspaceFailed()) {
      exportToWorkspaceQuestions.doesFailedMessageToasterLookCorrect();
    }
  },
};
