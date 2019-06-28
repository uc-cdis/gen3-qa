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
    I.waitForVisible(exportToWorkspaceProps.workspaceIFrameClass, 10);
  },

  goToExplorerPage() {
    I.amOnPage(exportToWorkspaceProps.explorerPath);
    if (portal.isPortalUsingGuppy()) {
      I.waitForVisible(exportToWorkspaceProps.guppyExplorerHeaderClass, 10);
    } else {
      I.waitForVisible(exportToWorkspaceProps.explorerHeaderClass, 10);
    }
  },

  exportDefaultManifestToWorkspace() {
    console.log('from \'Explore\' page, click \'Export to workspace\' button to export default manifest to workspace');
    this.goToExplorerPage();
    I.wait(60);
    I.waitForEnabled(exportToWorkspaceProps.exportToWorkspaceButtonXPath, 60);
    I.seeElement(exportToWorkspaceProps.exportToWorkspaceButtonXPath);
    I.click(exportToWorkspaceProps.exportToWorkspaceButtonXPath);
    I.waitForElement(exportToWorkspaceProps.exportToWorkspaceToasterClass, 30);
  },

  /* Direct to workspace by clicking the `Go to workspace` button in message toaster */
  jumpToWorkspacePage() {
    console.log('redirect to workspace');
    I.seeElement(exportToWorkspaceProps.goToWorkspaceButtonXPath);
    I.click(exportToWorkspaceProps.goToWorkspaceButtonXPath);
    I.waitForVisible(exportToWorkspaceProps.workspaceIFrameClass, 10);
  },

  /* Spawn up a workspace */
  async startWorkspace() {
    console.log('start workspace main app, spawn a new one if none exists');
    await within({ frame: exportToWorkspaceProps.workspaceIFrameClass }, async () => {
      /* Check to see if a workspace has already been spawned for current user in this common
      If not, spawn a new workspace for current user
      else, wait for main workspace app to appear
      Some hacky steps are in here to make sure each time the test can get into the main workspace app no matter if a new workspace needs to be spawned or not */
      const startCount = await I.grabNumberOfVisibleElements(exportToWorkspaceProps.startButtonSelector);
      if (startCount === 1) { // see "Start My Server" button
        I.click(exportToWorkspaceProps.startButtonSelector);
      }
      I.wait(1); // wait for spawn form to appear, if any
      const spawnOptionCount = await I.grabNumberOfVisibleElements(exportToWorkspaceProps.spawnListOptionSelector);
      if (spawnOptionCount === 1) { // see "Spawn" options
        I.click(exportToWorkspaceProps.spawnListOptionSelector);
        I.noTimeoutEnter(); // I.click() with Spawn button selector will randomly has timeout issues, this is a hacky workaround to ensure spawn input works every time
        I.wait(10); // wait for workspace spawn
        I.refreshPage(); // if not refresh, codeceptjs sometimes cannot pick up the main workspace app page automatically
        I.wait(10); // wait for refresh to get page updated
      }
    });
    I.switchTo(exportToWorkspaceProps.workspaceIFrameClass); // go back to '.workspace' iframe
    I.waitForVisible(exportToWorkspaceProps.mainWorkspaceAppSelector, 600);
    I.switchTo(); // get out
  },

  /* Mount the latest manifest using python codes as defined in 'exportToWorkspaceProps.mountManifestCode' */
  mountLatestManifestInJupyterNotebook(manifestName) {
    within({ frame: exportToWorkspaceProps.workspaceIFrameClass }, () => {
      I.waitForVisible(exportToWorkspaceProps.mainWorkspaceAppSelector, 600);
      I.waitForVisible(exportToWorkspaceProps.dataHyperlinkXPath, 10);
      I.click(exportToWorkspaceProps.dataHyperlinkXPath);
      console.log('in /data');
      const mountedManifestHyperlinkXPath = `//a[contains(@class, "item_link") and contains(@href, ${manifestName})]`;
      I.waitForVisible(mountedManifestHyperlinkXPath, 60);
    });
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
