const tasks = require('./workspaceTasks.js');
const questions = require('./workspaceQuestions.js');
const props = require('./workspaceProps.js');

/**
 * workspace service
 */
module.exports = {
  props,
  do: tasks,
  ask: questions,
};
