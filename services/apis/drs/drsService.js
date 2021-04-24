const drsTasks = require('./drsTasks.js');
const drsQuestions = require('./drsQuestions.js');
const drsProps = require('./drsProps.js');
const drsSequences = require('./drsSequences.js');

/**
 * DRS Service
 */
module.exports = {
  props: drsProps,
  do: drsTasks,
  ask: drsQuestions,
  complete: drsSequences,
};
