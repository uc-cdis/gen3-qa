const sheepdogTasks = require('./sheepdogTasks.js');
const sheepdogQuestions = require('./sheepdogQuestions.js');
const sheepdogProps = require('./sheepdogProps.js');
const sheepdogSequences = require('./sheepdogSequences.js');

/**
 * Sheepdog Actor
 */
module.exports = {
  props: sheepdogProps,

  do: sheepdogTasks,

  ask: sheepdogQuestions,

  complete: sheepdogSequences,
};
