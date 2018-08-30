const homeTasks = require('./homeTasks.js');
const homeQuestions = require('./homeQuestions.js');
const homeProps = require('./homeProps.js');
const homeSequences = require('./homeSequences.js');

/**
 * home Actor
 */
module.exports = {
  props: homeProps,

  do: homeTasks,

  ask: homeQuestions,

  complete: homeSequences,
};
