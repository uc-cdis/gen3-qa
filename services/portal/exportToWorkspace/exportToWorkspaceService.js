const exportToWorkspaceTasks = require('./exportToWorkspaceTasks.js');
const exportToWorkspaceQuestions = require('./exportToWorkspaceQuestions.js');
const exportToWorkspaceProps = require('./exportToWorkspaceProps.js');
const exportToWorkspaceSequences = require('./exportToWorkspaceSequences.js');

/**
 * exportToWorkspace Service
 */
module.exports = {
  props: exportToWorkspaceProps,

  do: exportToWorkspaceTasks,

  ask: exportToWorkspaceQuestions,

  complete: exportToWorkspaceSequences,
};
