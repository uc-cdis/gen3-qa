/**
 * exportToWorkspace Properties
 */
const hostname = process.env.HOSTNAME;
const endpointUrl = `https://${hostname}/`;
const wtsUrl = `http://workspace-token-service.${process.env.NAMESPACE}`;

module.exports = {
  workspacePath: '/workspace',
  explorerPath: '/explorer',

  workspaceIFrameClass: '.workspace',
  explorerHeaderClass: '.data-explorer',
  exportToWorkspaceFooterClass: '.map-data-model__submission-footer',
  loginPageClass: '.login-page',

  exportToWorkspaceButtonXPath: '//button[contains(@class, "g3-button--primary") and contains(lower-case(text()), "export to workspace")]',
  goToWorkspaceButtonXPath: '//button[contains(@class, "g3-button--primary") and contains(text(), "Go To Workspace")]',
  closeButtonXPath: '//button[contains(@class, "g3-button--primary") and contains(text(), "Close")]',
  deleteButtonXPath: '//button[contains(@class, "delete-button") and contains(@title, "Delete selected")]',
  deleteConfirmButtonXPath: '//button[contains(@class, "btn btn-default btn-sm btn-danger") and contains(@data-dismiss, "modal")]',

  startButtonSelector: '#start',
  spawnListOptionSelector: '#profile-item-0',
  newDropDownButtonSelector: '#new-dropdown-button',
  newPython3ButtonSelector: '#kernel-python3 > a',
  runNotebookButtonSelector: '#run_int > button:nth-child(1)',
  saveNotebookButtonSelector: '#save-notbook > button',
  selectAllDropDownButtonSelector: '#tree-selector-btn',
  selectAllNotebookButtonSelector: '#select-notebooks',

  selectAllCheckboxSelector: '#select-all',

  mainWorkspaceAppSelector: '#ipython-main-app',
  pythonNotebookPanelSelector: '#notebook_panel',
  pythonNotebookOutputAreaSelector: '.output_subarea.output_text.output_stream.output_stdout',
  backToWorkspaceLinkSelector: '#ipython_notebook > a',
  modalDialogSelector: 'body > div.modal.fade.in',

  succeededToasterMessage: 'Your cohort has been saved!',
  failedToasterMessage: 'There was an error exporting your cohort.',
  mountManifestCode: ['%cd -q ~', 'from workspace_tools.mount import Gen3Mount', `endpoint = "${endpointUrl}"`, `g3m = Gen3Mount(endpoint, wts_url="${wtsUrl}")`, 'g3m.mount_my_last_export()', '%ls ~/my_manifests/'],
  mountManifestSuccessfulMessage: 'Your exported files have been mounted to',
};
