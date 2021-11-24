const tasks = require('./workspaceTasks.js');
const questions = require('./workspaceQuestions.js');
const props = require('./workspaceProps.js');
// const discoverySequences = require('./discoverySequences.js');

/**
 * discovery service
 */
module.exports = {
  props,
  do: tasks,
  ask: questions,
  // complete: discoverySequences,
};
