const tasks = require('./tasks.js');
const questions = require('./questions.js');
const props = require('./props.js');
const sequences = require('./sequences.js');

/**
 * profile Service
 */
module.exports = {
  props,
  do: tasks,
  ask: questions,
  complete: sequences,
};
