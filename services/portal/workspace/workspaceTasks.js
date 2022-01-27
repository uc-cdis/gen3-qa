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
    I.waitForElement(props.iframeWorkspace, 30);
    I.click(props.iframeWorkspaceNewButton);
  },
};
