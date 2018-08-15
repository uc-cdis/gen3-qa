'use strict';
  
const fence_tasks = require('./fence_tasks.js');
const fence_questions = require('./fence_questions.js');
const fence_props = require('./fence_props.js');
const fence_sequences = require('./fence_sequences.js');

/**
 * fence Actor
 */
module.exports = {
  props: fence_props,

  do: fence_tasks,

  ask: fence_questions,

  complete: fence_sequences
};
  