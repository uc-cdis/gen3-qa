const guppyTasks = require('./guppyTasks.js');
const guppyQuestions = require('./guppyQuestions.js');
const guppyProps = require('./guppyProps.js');
const guppySequences = require('./guppySequences.js');

/**
 * guppy Service
 */
module.exports = {
  props: guppyProps,
  do: guppyTasks,
  ask: guppyQuestions,
  complete: guppySequences,
};
