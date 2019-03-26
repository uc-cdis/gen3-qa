const exportToWorkspaceQuestions = require('./exportToWorkspaceQuestions.js');
const exportToWorkspaceTasks = require('./exportToWorkspaceTasks.js');
const exportToWorkspaceProps = require('./exportToWorkspaceProps.js');

/**
 * exportToWorkspace sequences
 */
module.exports = {
  checkExportDefaultManifestToWorkspace() {
    exportToWorkspaceTasks.exportDefaultManifestToWorkspace();
    exportToWorkspaceQuestions.isManifestSavedToWorkspaceSucceeded();
  },
};
