const manifestServiceTasks = require('./manifestServiceTasks.js');
const manifestServiceQuestions = require('./manifestServiceQuestions.js');
const manifestServiceProps = require('./manifestServiceProps.js');
const manifestServiceSequences = require('./manifestServiceSequences.js');

/**
 * manifestService Service
 */
module.exports = {
  props: manifestServiceProps,
  do: manifestServiceTasks,
  ask: manifestServiceQuestions,
  complete: manifestServiceSequences,
};
