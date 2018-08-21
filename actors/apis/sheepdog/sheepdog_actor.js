const sheepdog_tasks = require('./sheepdog_tasks.js');
const sheepdog_questions = require('./sheepdog_questions.js');
const sheepdog_props = require('./sheepdog_props.js');
const sheepdog_sequences = require('./sheepdog_sequences.js');

/**
 * Sheepdog Actor
 */
module.exports = {
  props: sheepdog_props,

  do: sheepdog_tasks,

  ask: sheepdog_questions,

  complete: sheepdog_sequences,
};
