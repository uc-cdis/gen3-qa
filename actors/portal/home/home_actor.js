

const home_tasks = require('./home_tasks.js');
const home_questions = require('./home_questions.js');
const home_props = require('./home_props.js');
const home_sequences = require('./home_sequences.js');

/**
 * home Actor
 */
module.exports = {
  props: home_props,

  do: home_tasks,

  ask: home_questions,

  complete: home_sequences,
};
