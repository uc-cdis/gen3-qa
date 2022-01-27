const iframeWorkspaceXPath = '//iframe[@class="workspace" and @type="Workspace"]';

module.exports = {
  path: '/workspace',
  readyCue: {
    css: '.workspace__options',
  },
  // Launch button
  getLaunchButton: (name) => ({
    xpath: `//h3[text()="${name}")]/parent::div[@class="workspace__option"]/button[text()="Launch")]`,
  }),
  iframeWorkspace: {
    xpath: iframeWorkspaceXPath,
  },
  iframeWorkspaceNewButton: {
    xpath: `${iframeWorkspaceXPath}//button[text()="New"]`,
  },
};
