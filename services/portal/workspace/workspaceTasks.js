const props = require('./workspaceProps.js');

const I = actor();

module.exports = {
  // Navigate to workspace page
  goToPage() {
    I.amOnPage(props.path);
    I.waitForElement(props.readyCue, 30);
  },
  // Launch a workspace
  launchWorkspace(workspaceName) {
    I.click(props.getLaunchButton(workspaceName));
    I.waitForElement(props.iframeWorkspace, 600);
    I.saveScreenshot('workspace.tasks.launchWorkspace.png');
  },

  // Create a new Python 3 notebook, run a command and capture the output
  async runCommandinPythonNotebook(command) {
    I.switchTo('iframe');
    // Click on the New button in Jupyter notebook
    I.click(props.jupyterNbNewButton);
    I.waitForElement(props.jupyterNbNewPython3, 30);
    // Select Python 3 from the New dropdown
    I.click(props.jupyterNbNewPython3);
    I.waitForElement(props.jupyterNbInput, 30);
    // Type the command and run it
    I.click(props.jupyterNbInput);
    I.type(command);
    I.click(props.jupyterNbRunButton);
    // Capture the output
    const output = await I.grabTextFrom(props.jupyterNbOutput);
    I.saveScreenshot('workspace.tasks.runCommandinPythonNotebook.png');
    I.switchTo();
    return output;
  },
};
