const props = require('./workspaceProps.js');
const { Bash } = require('../../../utils/bash.js');

const bash = new Bash();

const I = actor();

module.exports = {
  // Navigate to workspace page
  goToPage() {
    I.amOnPage(props.path);
    I.waitForElement(props.readyCue, 30);
  },
  // Launch a workspace
  async launchWorkspace(workspaceName) {
    const res = await bash.runCommand('gen3 ec2 asg-set-capacity jupyter +10');
    console.dir(res);
    I.waitForElement(props.getLaunchButton(workspaceName), 120);
    I.click(props.getLaunchButton(workspaceName));
    if (process.env.DEBUG === 'true') {
      I.saveScreenshot('launched_workspace.png');
    }
    I.waitForElement(props.iframeWorkspace, 600);
    I.saveScreenshot('workspace.tasks.launchWorkspace.png');
  },

  // Create a new Python 3 notebook, run a command and capture the output
  async runCommandinPythonNotebook(command, expectedOutput = null) {
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
    let output = null;
    if (expectedOutput === null) {
      I.dontSeeElement(props.jupyterNbOutput, 5);
    } else {
      output = await I.grabTextFrom(props.jupyterNbOutput);
    }
    I.saveScreenshot('workspace.tasks.runCommandinPythonNotebook.png');
    I.switchTo();
    return output;
  },
};
