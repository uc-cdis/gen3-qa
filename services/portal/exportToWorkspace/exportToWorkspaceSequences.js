const exportToWorkspaceQuestions = require('./exportToWorkspaceQuestions.js');
const exportToWorkspaceTasks = require('./exportToWorkspaceTasks.js');

const I = actor();

/**
 * exportToWorkspace sequences
 */
module.exports = {
  checkExportDefaultManifestToWorkspace() {
    exportToWorkspaceTasks.exportDefaultManifestToWorkspace();
    exportToWorkspaceQuestions.isManifestSavedToWorkspaceSucceeded();
    exportToWorkspaceTasks.jumpToWorkspacePage();

    if(I.seeElement())
  },
};
