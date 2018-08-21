const peregrine_tasks = require('./peregrine_tasks.js');
const peregrine_questions = require('./peregrine_questions.js');
const peregrine_props = require('./peregrine_props.js');

/**
 * peregrine Actor
 */
module.exports = {
  props: peregrine_props,

  do: peregrine_tasks,

  ask: peregrine_questions,
};
