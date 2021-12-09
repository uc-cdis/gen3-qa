const props = require('./workspaceProps.js');

const I = actor();

module.exports = {
  goToPage() {
    I.amOnPage(props.path);
    I.waitForElement(props.readyCue, 30);
  },
  launchWorkspace(workspaceName) {
    I.click(props.getLaunchButton(workspaceName));
    I.waitForElement(props.iframeWorkspace, 30);
    I.click(props.iframeWorkspaceNewButton);
  },
};
