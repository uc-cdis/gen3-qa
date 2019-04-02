/**
 * exportToWorkspace Properties
 */
module.exports = {
  workspacePath: '/workspace',
  explorerPath: '/explorer',

  workspaceIFrameClass: '.workspace',

  explorerHeaderClass: '.data-explorer',
  exportToWorkspaceFooterClass: '.map-data-model__submission-footer',

  exportToWorkspaceButtonXPath: '//button[contains(@class, "g3-button--primary") and contains(text(), "Export To Workspace")]',
  goToWorkspaceButtonXPath: '//button[contains(@class, "g3-button--primary") and contains(text(), "Go To Workspace")]',
};
