const exportToWorkspaceProps = require('./exportToWorkspaceProps.js');
const user = require('../../../utils/user.js');
const I = actor();
const portal = require('../../../utils/portal.js');

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

  selectFilesAndGotoMappingPage(fileObjects) {
    // click checkboxes
    fileObjects.forEach(obj => {
      const guid = obj.fileGuid;
      I.click(`input[id='${guid}']`);
    });
    
    // click "Map Files" and wait for loading 
    I.click("Map Files");
    I.waitForVisible(dataUploadProps.submissionFormClass, 5);
  },

  selectProject() {
    I.click(dataUploadProps.projectSelectionDropdownSelector);
    I.waitForText(dataUploadProps.testProjectName, 5);
    I.click(`//*[contains(text(), '${dataUploadProps.testProjectName}')]`, dataUploadProps.selectOptionClass);
  },

  selectFileNode() {
    I.click(dataUploadProps.fileNodeSelectionDropdownSelector);
    I.waitForVisible(dataUploadProps.fileNodeSelectionOuterClass, 5);
    I.click(dataUploadProps.fileNodeSelectionFirstItemClass);
  },

  async fillAllRequiredFields() {
    // fill `abc` for each text input
    const textInputCnt = await I.grabNumberOfVisibleElements(dataUploadProps.fileNodeRequiredFieldTextInputXPath);
    for (let i = 1; i <= textInputCnt; i +=1) {
      I.fillField(`(${dataUploadProps.fileNodeRequiredFieldTextInputXPath})[${i}]`, 'abc');
    }

    // select first item for each selection input
    const selectionInputCnt = await I.grabNumberOfVisibleElements(dataUploadProps.fileNodeRequiredFieldSelectionInputXPath);
    for (let i = 1; i <= selectionInputCnt; i +=1) {
      I.click(`(${dataUploadProps.fileNodeRequiredFieldSelectionInputXPath})[${i}]${dataUploadProps.selectionArrowXPath}`);
      I.waitForVisible(`(${dataUploadProps.fileNodeRequiredFieldSelectionInputXPath})[${i}]${dataUploadProps.selectionMenuXPath}`, 5);
      I.click(`(${dataUploadProps.fileNodeRequiredFieldSelectionInputXPath})[${i}]${dataUploadProps.firstSelectionItemXPath}`);
    }
  },

  linksToParentNodes(submitterID) {
    I.waitForVisible(dataUploadProps.parentSelectionXPath, 5);
    I.click(`${dataUploadProps.parentSelectionXPath}${dataUploadProps.selectionArrowXPath}`);
    I.waitForVisible(`${dataUploadProps.parentSelectionXPath}${dataUploadProps.selectionMenuXPath}`, 5);
    I.waitForText(submitterID, 5);
    I.click(`//*[contains(text(), '${submitterID}')]`, dataUploadProps.parentSelectionXPath);
  },
  
  clickSubmit() {
    I.waitForVisible(dataUploadProps.submitButtonXPath, 5);
    I.click(dataUploadProps.submitButtonXPath);
  },
};
