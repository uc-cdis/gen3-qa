const guppyTasks = require('./guppyTasks.js');
const guppyProps = require('./guppyProps.js');
const guppySequences = require('./guppySequences.js');

/**
 * guppy Service
 */
module.exports = {
  props: guppyProps,
  do: guppyTasks,
  complete: guppySequences,
};
