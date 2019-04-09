/* eslint-disable max-len */
const exportToWorkspaceProps = require('./exportToWorkspaceProps.js');

const I = actor();

/**
 * exportToWorkspace Tasks
 */
module.exports = {
  goToWorkspacePage() {
    I.amOnPage(exportToWorkspaceProps.workspacePath);
    I.waitForVisible(exportToWorkspaceProps.workspaceIFrameClass, 10);
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

  /* Direct to workspace by clicking the `Go to workspace` button in message toaster */
  jumpToWorkspacePage() {
    I.seeElement(exportToWorkspaceProps.goToWorkspaceButtonXPath);
    I.click(exportToWorkspaceProps.goToWorkspaceButtonXPath);
    I.waitForVisible(exportToWorkspaceProps.workspaceIFrameClass, 10);
  },

  /* Spawn up a workspace */
  startWorkspace() {
    within({ frame: exportToWorkspaceProps.workspaceIFrameClass }, async () => {
      const start = await I.grabNumberOfVisibleElements(exportToWorkspaceProps.startButtonSelector);
      if (start === 1) { // see "Start My Server" button
        I.click(exportToWorkspaceProps.startButtonSelector);
        const spawn = await I.grabNumberOfVisibleElements(exportToWorkspaceProps.spawnButtonSelector);
        if (spawn === 1) {
          I.click(exportToWorkspaceProps.spawnButtonSelector); // spawn with default config
        }
      }
      I.waitForVisible(exportToWorkspaceProps.mainWorkspaceAppSelector, 600); // ipython may be very slow on start up
    });
  },

  /* Mount the latest manifest using python codes as defined in 'exportToWorkspaceProps.mountManifestCode' */
  async mountLatestManifestInJupyterNotebook() {
    const output = await within({ frame: exportToWorkspaceProps.workspaceIFrameClass }, () => {
      I.waitForVisible(exportToWorkspaceProps.mainWorkspaceAppSelector, 600);
      I.click(exportToWorkspaceProps.newDropDownButtonSelector);
      I.click(exportToWorkspaceProps.newPython3ButtonSelector);
      I.waitForVisible(exportToWorkspaceProps.pythonNotebookPanelSelector, 60); // wait for new notebook to show up
      exportToWorkspaceProps.mountManifestCode.forEach((line) => {
        I.pressKey(line);
        I.pressKey('Enter');
      });
      I.wait(3); // wait for save button becomes clickable
      I.click(exportToWorkspaceProps.runNotebookButtonSelector);
      I.waitForVisible(exportToWorkspaceProps.pythonNotebookOutputAreaSelector, 60);
      return I.grabTextFrom(exportToWorkspaceProps.pythonNotebookOutputAreaSelector);
    });
    return output;
  },

  /* Get the mounted manifest filename from python output */
  async grabManifestFilename() {
    const result = await I.grabTextFrom(exportToWorkspaceProps.exportToWorkspaceFooterClass);
    const splittedResult = result.split('File Name: ');
    if (splittedResult.length === 2) {
      return splittedResult[1];
    }
    return '';
  },

  /* Step out from notebook and go back to workspace page */
  async backToWorkspace() {
    within({ frame: exportToWorkspaceProps.workspaceIFrameClass }, () => {
      I.waitForVisible(exportToWorkspaceProps.saveNotebookButtonSelector, 10);
      I.click(exportToWorkspaceProps.saveNotebookButtonSelector);
      I.wait(3);
      I.click(exportToWorkspaceProps.backToWorkspaceLinkSelector);
    });
  },

  /* Remove all notebooks from workspace */
  async deleteAllJupyterNotebooks() {
    within({ frame: exportToWorkspaceProps.workspaceIFrameClass }, async () => {
      I.waitForVisible(exportToWorkspaceProps.selectAllCheckboxSelector, 30);
      I.click(exportToWorkspaceProps.selectAllCheckboxSelector);
      I.waitForVisible(exportToWorkspaceProps.selectAllDropDownButtonSelector, 30);
      I.click(exportToWorkspaceProps.selectAllDropDownButtonSelector);
      I.waitForVisible(exportToWorkspaceProps.selectAllNotebookButtonSelector, 10);
      I.click(exportToWorkspaceProps.selectAllNotebookButtonSelector);
      I.waitForVisible(exportToWorkspaceProps.deleteButtonXPath, 10);
      I.click(exportToWorkspaceProps.deleteButtonXPath);
      I.wait(3); // wait for modal dialog to show
      await this.checkAndAcceptJupyterDialogIfVisible();
    });
  },

  /* Check if there is a modal dialog from Jupyther, if yes, accept it */
  async checkAndAcceptJupyterDialogIfVisible() {
    const ct = await I.grabNumberOfVisibleElements(exportToWorkspaceProps.modalDialogSelector);
    if (ct === 1) {
      const bt = await I.grabNumberOfVisibleElements(exportToWorkspaceProps.deleteConfirmButtonXPath);
      if (bt === 1) {
        I.click(exportToWorkspaceProps.deleteConfirmButtonXPath);
      }
    }
  },
};
