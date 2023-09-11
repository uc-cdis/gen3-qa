/* eslint-disable max-len */
const exportToWorkspaceProps = require('./exportToWorkspaceProps.js');
const portal = require('../../../utils/portal');

const I = actor();

/**
 * exportToWorkspace Tasks
 */
module.exports = {
  goToWorkspacePage() {
    I.amOnPage(exportToWorkspaceProps.workspacePath);
    I.saveScreenshot('exportToWorkspace_workspacePage.png');
    I.waitForVisible(exportToWorkspaceProps.workspaceDivClass, 100);
  },

  async goToExplorerPage() {
    I.amOnPage(exportToWorkspaceProps.explorerPath);
    if (await portal.isPortalUsingGuppy()) {
      I.waitForVisible(exportToWorkspaceProps.guppyExplorerHeaderClass, 10);
    } else {
      I.waitForVisible(exportToWorkspaceProps.explorerHeaderClass, 10);
    }
  },

  async exportDefaultManifestToWorkspace() {
    console.log('from \'Explore\' page, click \'Export to workspace\' button to export default manifest to workspace');
    await this.goToExplorerPage();
    I.waitForElement(exportToWorkspaceProps.exportToWorkspaceButtonXPath, 30);
    I.seeElement(exportToWorkspaceProps.exportToWorkspaceButtonXPath);
    I.click(exportToWorkspaceProps.exportToWorkspaceButtonXPath);
    I.waitForElement(exportToWorkspaceProps.exportToWorkspaceToasterClass, 60);
  },

  /* Direct to workspace by clicking the `Go to workspace` button in message toaster */
  jumpToWorkspacePage() {
    console.log('redirect to workspace');
    I.seeElement(exportToWorkspaceProps.goToWorkspaceButtonXPath);
    I.click(exportToWorkspaceProps.goToWorkspaceButtonXPath);
    I.waitForVisible(exportToWorkspaceProps.workspaceDivClass, 10);
  },

  /* Spawn up a workspace using JupyterHub */
  async startWorkspaceJupyterHub() {
    console.log('start workspace main app using JupyterHub, spawn a new one if none exists');
    await within({ frame: exportToWorkspaceProps.workspaceIFrameXPath }, async () => {
      /* Check to see if a workspace has already been spawned for current user in this common
      If not, spawn a new workspace for current user
      else, wait for main workspace app to appear
      Some hacky steps are in here to make sure each time the test can get into the main workspace app no matter if a new workspace needs to be spawned or not */
      const startCount = await I.grabNumberOfVisibleElements(exportToWorkspaceProps.startButtonSelector);
      if (startCount === 1) { // see "Start My Server" button
        I.click(exportToWorkspaceProps.startButtonSelector);
      }
      I.wait(3); // wait for spawn form to appear, if any
      const spawnOptionCount = await I.grabNumberOfVisibleElements(exportToWorkspaceProps.spawnListOptionSelector);
      if (spawnOptionCount === 1) { // see "Spawn" options
        I.click(exportToWorkspaceProps.spawnListOptionSelector);
        I.noTimeoutEnter(); // I.click() with Spawn button selector will randomly has timeout issues, this is a hacky workaround to ensure spawn input works every time
        I.wait(10); // wait for workspace spawn
        I.refreshPage(); // if not refresh, codeceptjs sometimes cannot pick up the main workspace app page automatically
        I.wait(10); // wait for refresh to get page updated
      }
    });
    I.switchTo(exportToWorkspaceProps.workspaceIFrameXPath); // go back to '.workspace' iframe
    I.waitForVisible(exportToWorkspaceProps.mainWorkspaceAppSelector, 60);
    I.switchTo(); // get out
  },

  /* Spawn up a workspace using Hatchery */
  async startWorkspaceHatchery() {
    console.log('start workspace main app using Hatchery');
    I.waitForVisible(exportToWorkspaceProps.hatcheryLaunchNotebookButtonXPath, 10);
    I.click(exportToWorkspaceProps.hatcheryLaunchNotebookButtonXPath);
    I.waitForVisible(exportToWorkspaceProps.workspaceIFrameDivClass, 600);
    I.switchTo(exportToWorkspaceProps.workspaceIFrameXPath); // go to '.workspace' iframe
    I.waitForVisible(exportToWorkspaceProps.mainWorkspaceAppSelector, 10);
    I.switchTo(); // get out
  },

  /* Mount the latest manifest for JupyterHub */
  mountLatestManifestInJupyterNotebookJupyterHub(manifestName) {
    within({ frame: exportToWorkspaceProps.workspaceIFrameXPath }, () => {
      I.waitForVisible(exportToWorkspaceProps.mainWorkspaceAppSelector, 60);
      I.waitForVisible(exportToWorkspaceProps.jupyterHubDataHyperlinkXPath, 10);
      I.click(exportToWorkspaceProps.jupyterHubDataHyperlinkXPath);
      console.log('in /data');
      const mountedManifestHyperlinkXPath = `//a[contains(@class, "item_link") and contains(@href, ${manifestName})]`;
      I.waitForVisible(mountedManifestHyperlinkXPath, 60);
    });
  },

  /* Mount the latest manifest for Hatchery */
  mountLatestManifestInJupyterNotebookHatchery(manifestName) {
    within({ frame: exportToWorkspaceProps.workspaceIFrameXPath }, () => {
      I.waitForVisible(exportToWorkspaceProps.mainWorkspaceAppSelector, 60);
      I.waitForVisible(exportToWorkspaceProps.hatcheryPDHyperlinkXPath, 10);
      I.click(exportToWorkspaceProps.hatcheryPDHyperlinkXPath);
      I.click(exportToWorkspaceProps.hatcheryDataHyperlinkXPath);
      console.log('in /pd/data');
      const mountedManifestHyperlinkXPath = `//a[contains(@class, "item_link") and contains(@href, /lw-workspace/proxy/tree/pd/data/${manifestName})]`;
      I.waitForVisible(mountedManifestHyperlinkXPath, 60);
    });
  },

  /* Terminate up a workspace using Hatchery */
  async terminateWorkspaceHatcheryAndExit() {
    I.amOnPage(exportToWorkspaceProps.workspacePath);
    I.wait(10);
    const terminateBtnCount = await I.grabNumberOfVisibleElements(exportToWorkspaceProps.terminateWorkspaceButtonXPath);
    if (terminateBtnCount !== 0) {
      I.click(exportToWorkspaceProps.terminateWorkspaceButtonXPath);
    }
  },

  /* Get the manifest name to be mounted from python output */
  async grabManifestName() {
    console.log('grab the filename of exported manifest file');
    const result = await I.grabTextFrom(exportToWorkspaceProps.exportToWorkspaceToasterClass);
    const splittedResult = result.split(': ');
    if (splittedResult.length === 2) {
      const manifestName = splittedResult[1].split('.json');
      return manifestName[0];
    }
    return '';
  },

  /* Attempt to get to 'Workspace' page when user has logged out */
  async logoutAndGetToWorkspace(home) {
    console.log('Log out current user');
    await home.complete.logout();
    await home.do.handleSystemUsePopup();
    I.saveScreenshot('afterLogout.png');
    console.log('Try to get to workspace');
    I.amOnPage(exportToWorkspaceProps.workspacePath);
    console.log('Check if still seeing login page');
    I.seeElement(exportToWorkspaceProps.loginPageClass);
  },

  /* Attempt to get to 'Workspace' page when user has logged in */
  async loginAndGetToWorkspace(home) {
    console.log('Login as test user');
    await home.complete.login();
    console.log('Get to Workspace page and verify now is on workspace page');
    I.saveScreenshot('afterLogin.png');
    this.goToWorkspacePage();
  },
};
