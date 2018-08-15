const dict_tasks = require('./dict_tasks.js');
const dict_questions = require('./dict_questions.js');
const dict_props = require('./dict_props.js');

/**
 * Dictionary Actor
 */
module.exports = {
  props: dict_props,

  do: dict_tasks,

  ask: dict_questions
};
