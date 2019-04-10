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
    console.log('from \'Explore\' page, click \'Export to workspace\' button to export default manifest to workspace');
    this.goToExplorerPage();
    I.seeElement(exportToWorkspaceProps.exportToWorkspaceButtonXPath);
    I.click(exportToWorkspaceProps.exportToWorkspaceButtonXPath);
  },

  /* Direct to workspace by clicking the `Go to workspace` button in message toaster */
  jumpToWorkspacePage() {
    console.log('redirect to workspace');
    I.seeElement(exportToWorkspaceProps.goToWorkspaceButtonXPath);
    I.click(exportToWorkspaceProps.goToWorkspaceButtonXPath);
    I.waitForVisible(exportToWorkspaceProps.workspaceIFrameClass, 10);
  },

  /* Spawn up a workspace */
  startWorkspace() {
    console.log('start workspace main app, spawn a new one if none exists');
    within({ frame: exportToWorkspaceProps.workspaceIFrameClass }, async () => {
      /* Check to see if a workspace has already been spawned for current user in this common
      If not, spawn a new workspace for current user
      else, wait for main workspace app to appear */
      const start = await I.grabNumberOfVisibleElements(exportToWorkspaceProps.startButtonSelector);
      if (start === 1) { // see "Start My Server" button
        I.click(exportToWorkspaceProps.startButtonSelector);
      }
      I.wait(3); // wait for spawn form to appear, if any
      const spawn = await I.grabNumberOfVisibleElements(exportToWorkspaceProps.spawnButtonSelector);
      if (spawn === 1) { // see "Spawn" button
        I.click(exportToWorkspaceProps.spawnButtonSelector); // spawn with default config
      }
      I.waitForVisible(exportToWorkspaceProps.mainWorkspaceAppSelector, 600); // ipython may be very slow on start up
    });
  },

  /* Mount the latest manifest using python codes as defined in 'exportToWorkspaceProps.mountManifestCode' */
  async mountLatestManifestInJupyterNotebook() {
    const output = await within({ frame: exportToWorkspaceProps.workspaceIFrameClass }, () => {
      I.waitForVisible(exportToWorkspaceProps.mainWorkspaceAppSelector, 600);
      console.log('create a python notebook');
      I.click(exportToWorkspaceProps.newDropDownButtonSelector);
      I.click(exportToWorkspaceProps.newPython3ButtonSelector);
      I.waitForVisible(exportToWorkspaceProps.pythonNotebookPanelSelector, 60); // wait for new notebook to show up
      console.log('mount the latest manifest using python code');
      exportToWorkspaceProps.mountManifestCode.forEach((line) => {
        I.pressKey(line);
        I.pressKey('Enter');
      });
      I.wait(3); // give it some time for updating input area and top tool bar
      I.click(exportToWorkspaceProps.runNotebookButtonSelector);
      console.log('grab mounted filename from output area');
      I.waitForVisible(exportToWorkspaceProps.pythonNotebookOutputAreaSelector, 60);
      return I.grabTextFrom(exportToWorkspaceProps.pythonNotebookOutputAreaSelector);
    });
    return output;
  },

  /* Get the mounted manifest filename from python output */
  async grabManifestFilename() {
    console.log('grab the filename of exported manifest file');
    const result = await I.grabTextFrom(exportToWorkspaceProps.exportToWorkspaceFooterClass);
    const splittedResult = result.split('File Name: ');
    if (splittedResult.length === 2) {
      return splittedResult[1];
    }
    return '';
  },

  /* Step out from notebook and go back to workspace page */
  async backToWorkspace() {
    console.log('go back to workspace');
    within({ frame: exportToWorkspaceProps.workspaceIFrameClass }, () => {
      I.waitForVisible(exportToWorkspaceProps.saveNotebookButtonSelector, 10);
      I.click(exportToWorkspaceProps.saveNotebookButtonSelector);
      I.wait(3); // give it some time to finish the saving work
      I.click(exportToWorkspaceProps.backToWorkspaceLinkSelector);
    });
  },

  /* Remove all notebooks from workspace */
  async deleteAllJupyterNotebooks() {
    console.log('delete all Jupyter notebooks');
    within({ frame: exportToWorkspaceProps.workspaceIFrameClass }, async () => {
      I.waitForVisible(exportToWorkspaceProps.selectAllCheckboxSelector, 30);
      I.click(exportToWorkspaceProps.selectAllCheckboxSelector);
      I.waitForVisible(exportToWorkspaceProps.selectAllDropDownButtonSelector, 30);
      I.click(exportToWorkspaceProps.selectAllDropDownButtonSelector);
      I.waitForVisible(exportToWorkspaceProps.selectAllNotebookButtonSelector, 10);
      I.click(exportToWorkspaceProps.selectAllNotebookButtonSelector);
      I.waitForVisible(exportToWorkspaceProps.deleteButtonXPath, 10);
      I.click(exportToWorkspaceProps.deleteButtonXPath);
      I.waitForVisible(exportToWorkspaceProps.deleteConfirmButtonXPath, 10);
      I.click(exportToWorkspaceProps.deleteConfirmButtonXPath);
    });
  },

  /* Attempt to get to 'Workspace' page when user has logged out */
  logoutAndGetToWorkspace(home) {
    console.log('Log out current user');
    home.complete.logout();
    console.log('Try to get to workspace');
    I.amOnPage(exportToWorkspaceProps.workspacePath);
    console.log('Check if still seeing login page');
    I.seeElement(exportToWorkspaceProps.loginPageClass);
  },

  /* Attempt to get to 'Workspace' page when user has logged in */
  loginAndGetToWorkspace(home) {
    console.log('Login as test user');
    home.complete.login();
    console.log('Get to Workspace page and verify now is on workspace page');
    this.goToWorkspacePage();
  },
};
