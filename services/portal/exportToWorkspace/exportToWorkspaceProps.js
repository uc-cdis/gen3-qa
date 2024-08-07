/**
 * exportToWorkspace Properties
 */

module.exports = {
  workspacePath: 'workspace',
  explorerPath: 'explorer',

  workspaceDivClass: '.workspace', // for Hatchery
  workspaceIFrameDivClass: '.workspace__iframe', // for Hatchery
  explorerHeaderClass: '.data-explorer',
  guppyExplorerHeaderClass: '.guppy-data-explorer',
  exportToWorkspaceToasterClass: '.toaster__div',
  loginPageClass: '.login-page',

  exportToWorkspaceButtonXPath: '//button[contains(@class, "g3-button--primary") and contains(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "export to workspace")]',
  goToWorkspaceButtonXPath: '//button[contains(@class, "g3-button--primary") and contains(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "go to workspace")]',
  closeButtonXPath: '//button[contains(@class, "g3-button--primary") and contains(text(), "Close")]',
  workspaceIFrameXPath: '//iframe[contains(@class, "workspace")]',
  jupyterHubDataHyperlinkXPath: '//a[contains(@class, "item_link") and contains(@href, "/tree/data")]',
  hatcheryPDHyperlinkXPath: '//a[contains(@class, "item_link") and contains(@href, "/lw-workspace/proxy/tree/pd")]',
  hatcheryDataHyperlinkXPath: '//a[contains(@class, "item_link") and contains(@href, "/lw-workspace/proxy/tree/pd/data")]',
  hatcheryLaunchNotebookButtonXPath: '//div[contains(@class,"workspace-option")]/h3[contains(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "jupyter") and contains(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "python")]/following-sibling::button',
  terminateWorkspaceButtonXPath: '//button[contains(@class, "g3-button--primary") and contains(text(), "Terminate Workspace")]',

  startButtonSelector: '#start',
  spawnListOptionSelector: '#profile-item-0',
  mainWorkspaceAppSelector: '#ipython-main-app',

  succeededToasterMessage: 'Your cohort has been saved!',
  failedToasterMessage: 'There was an error exporting your cohort.',
  mountManifestSuccessfulMessage: 'Your exported files have been mounted to',
};
