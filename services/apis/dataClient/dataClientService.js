const dataClientTasks = require('./dataClientTasks.js');
const dataClientQuestions = require('./dataClientQuestions.js');
const dataClientProps = require('./dataClientProps.js');
const dataClientSequences = require('./dataClientSequences.js');

/**
 * dataClient Service
 */
module.exports = {
  props: dataClientProps,
  do: dataClientTasks,
  ask: dataClientQuestions,
  complete: dataClientSequences,
};
