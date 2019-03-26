const exportToWorkspaceProps = require('./exportToWorkspaceProps.js');

const I = actor();

/**
 * exportToWorkspace Tasks
 */
module.exports = {
  goToWorkspacePage() {
    I.amOnPage(exportToWorkspaceProps.workspacePath);
    within({ frame: exportToWorkspaceProps.workspaceIFrameId }, () => {
      I.see('JupyterHub');
    });
  },

  goToExplorerPage() {
    I.amOnPage(exportToWorkspaceProps.explorerPath);
    I.waitForVisible(exportToWorkspaceProps.explorerHeaderClass, 5);
  },

  exportDefaultManifestToWorkspace() {
    I.click("Export To Workspace")
  },
};
