/**
 * exportToWorkspace Properties
 */
const hostname = process.env.HOSTNAME;
const endpoint = `https://${hostname}/`;
const wtsUrl = `http://workspace-token-service.${process.env.NAMESPACE}`;

module.exports = {
  workspacePath: '/workspace',
  explorerPath: '/explorer',

  workspaceIFrameClass: '.workspace',

  explorerHeaderClass: '.data-explorer',
  exportToWorkspaceFooterClass: '.map-data-model__submission-footer',
  loginPageClass: '.login-page',

  exportToWorkspaceButtonXPath: '//button[contains(@class, "g3-button--primary") and contains(text(), "Export To Workspace")]',
  goToWorkspaceButtonXPath: '//button[contains(@class, "g3-button--primary") and contains(text(), "Go To Workspace")]',
  closeButtonXPath: '//button[contains(@class, "g3-button--primary") and contains(text(), "Close")]',
  spawnButtonSelector: '#spawn_form > input',
  backToWorkspaceLinkSelector: '#ipython_notebook > a',

  mountManifestCode: ['%cd -q ~', 'from workspace_tools.mount import Gen3Mount', `endpoint = "${endpoint}"`, `g3m = Gen3Mount(endpoint, wts_url="${wtsUrl}")`, 'g3m.mount_my_last_export()', '%ls ~/my_manifests/'],
  mountManifestSuccessfulMessage: 'Your exported files have been mounted to',
};
