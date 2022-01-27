const props = require('./workspaceProps.js');

const I = actor();

module.exports = {
  // Check if workspace page is the current page
  isCurrentPage() {
    I.waitUrlEquals(props.path);
  },
  // Check if the workspace page is ready
  isPageLoaded() {
    I.seeElement(props.readyCue, 30);
  },
};
