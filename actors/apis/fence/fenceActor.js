const fenceTasks = require('./fenceTasks.js');
const fenceQuestions = require('./fenceQuestions.js');
const fenceProps = require('./fenceProps.js');
const fenceSequences = require('./fenceSequences.js');

/**
 * fence Actor
 */
module.exports = {
  props: fenceProps,

  do: fenceTasks,

  ask: fenceQuestions,

  complete: fenceSequences,
};
