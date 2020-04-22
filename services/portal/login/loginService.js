const loginTasks = require('./loginTasks.js');
const loginQuestions = require('./loginQuestions.js');
const loginProps = require('./loginProps.js');
const loginSequences = require('./loginSequences.js');

/**
 * login service
 */
module.exports = {
  props: loginProps,

  do: loginTasks,

  ask: loginQuestions,

  complete: loginSequences,
};
