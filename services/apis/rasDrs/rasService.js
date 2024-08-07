const rasTasks = require('./rasTasks.js');
const rasQuestions = require('./rasQuestions.js');
const rasProps = require('./rasProps.js');

/**
 * RAS Service
 */
module.exports = {
  props: rasProps,

  do: rasTasks,

  ask: rasQuestions,
};
