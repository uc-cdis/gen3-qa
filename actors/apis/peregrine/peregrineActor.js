const peregrineTasks = require('./peregrineTasks.js');
const peregrineQuestions = require('./peregrineQuestions.js');
const peregrineProps = require('./peregrineProps.js');

/**
 * peregrine Actor
 */
module.exports = {
  props: peregrineProps,

  do: peregrineTasks,

  ask: peregrineQuestions,
};
