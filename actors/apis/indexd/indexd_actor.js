

const indexd_tasks = require('./indexd_tasks.js');
const indexd_questions = require('./indexd_questions.js');
const indexd_props = require('./indexd_props.js');
const indexd_sequences = require('./indexd_sequences.js');

/**
 * indexd Actor
 */
module.exports = {
  props: indexd_props,

  do: indexd_tasks,

  ask: indexd_questions,

  complete: indexd_sequences,
};

