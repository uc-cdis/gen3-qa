const indexdTasks = require('./indexdTasks.js');
const indexdQuestions = require('./indexdQuestions.js');
const indexdProps = require('./indexdProps.js');
const indexdSequences = require('./indexdSequences.js');

/**
 * indexd Service
 */
module.exports = {
  props: indexdProps,

  do: indexdTasks,

  ask: indexdQuestions,

  complete: indexdSequences,
};
