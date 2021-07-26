const tasks = require('./discoveryTasks.js');
const questions = require('./discoveryQuestions.js');
const props = require('./discoveryProps.js');
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
