const exportToWorkspaceProps = require('./exportToWorkspaceProps.js');

const I = actor();

/**
 * exportToWorkspace Tasks
 */
module.exports = {
  goToWorkspacePage() {
    I.amOnPage(exportToWorkspaceProps.workspacePath);
    within({ frame: exportToWorkspaceProps.workspaceIFrameClass }, () => {
      I.see('JupyterHub');
    });
  },

  goToExplorerPage() {
    I.amOnPage(exportToWorkspaceProps.explorerPath);
    I.waitForVisible(exportToWorkspaceProps.explorerHeaderClass, 10);
  },

  exportDefaultManifestToWorkspace() {
    this.goToExplorerPage();
    I.seeElement(exportToWorkspaceProps.exportToWorkspaceButtonXPath);
    I.click(exportToWorkspaceProps.exportToWorkspaceButtonXPath);
  },

  jumpToWorkspacePage() {
    I.seeElement(exportToWorkspaceProps.goToWorkspaceButtonXPath);
    I.click(exportToWorkspaceProps.goToWorkspaceButtonXPath);
    I.seeElement(exportToWorkspaceProps.workspaceIFrameClass);
  },

};
