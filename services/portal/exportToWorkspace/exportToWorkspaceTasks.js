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

  jumpToWorkspacePage() {
    I.seeElement(exportToWorkspaceProps.goToWorkspaceButtonXPath);
    I.click(exportToWorkspaceProps.goToWorkspaceButtonXPath);
    I.seeElement(exportToWorkspaceProps.workspaceIFrameClass);
  },

  startWorkspace() {
    within({ frame: exportToWorkspaceProps.workspaceIFrameClass }, async () => {
      const start = await I.grabNumberOfVisibleElements('#start');
      if (start === 1) { // see "Start My Server" button
        I.click('#start');
        const spawn = await I.grabNumberOfVisibleElements(exportToWorkspaceProps.spawnButtonSelector);
        if (spawn === 1) {
          I.click(exportToWorkspaceProps.spawnButtonSelector); // spawn with default config
        }
      }
      I.waitForVisible('#ipython-main-app', 60);
    });
  },

  async mountLatestManifestInJupyterNotebook() {
    const output = await within({ frame: exportToWorkspaceProps.workspaceIFrameClass }, () => {
      I.waitForVisible('#ipython-main-app', 60);
      I.click('#new-dropdown-button');
      I.click('#kernel-python3 > a');
      I.waitForVisible('#notebook_panel', 30); // wait for new notebook to show up
      exportToWorkspaceProps.mountManifestCode.forEach((line) => {
        I.pressKey(line);
        I.pressKey('Enter');
      });
      I.wait(5);
      I.click('#run_int > button:nth-child(1)');
      I.waitForVisible('.output_subarea.output_text.output_stream.output_stdout', 60);
      return I.grabTextFrom('.output_subarea.output_text.output_stream.output_stdout');
    });
    return output;
  },

  async grabManifestFilename() {
    const result = await I.grabTextFrom(exportToWorkspaceProps.exportToWorkspaceFooterClass);
    const splittedResult = result.split('File Name: ');
    if (splittedResult.length === 2) {
      return splittedResult[1];
    }
    return '';
  },

  backToWorkspace() {
    within({ frame: exportToWorkspaceProps.workspaceIFrameClass }, async () => {
      I.click(exportToWorkspaceProps.backToWorkspaceLinkSelector);
      const pt = await I.grabPopupText();
      I.say(pt);
      I.saveScreenshot('a1.png');
      if (pt !== null) {
        I.acceptPopup();
      }
    });
  },

  deleteJupyterNotebook() {

  },
};
