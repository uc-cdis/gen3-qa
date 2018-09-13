const pidginTasks = require('./pidginTasks.js');
const pidginQuestions = require('./pidginQuestions.js');
const pidginProps = require('./pidginProps.js');
const pidginSequences = require('./pidginSequences.js');

/**
 * pidgin Service
 */
module.exports = {
  props: pidginProps,

  do: pidginTasks,

  ask: pidginQuestions,

  complete: pidginSequences,
};
