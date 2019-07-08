const pelicanTasks = require('./pelicanTasks.js');
const pelicanQuestions = require('./pelicanQuestions.js');
const pelicanProps = require('./pelicanProps.js');
const pelicanSequences = require('./pelicanSequences.js');

/**
 * pelican Service
 */
module.exports = {
  props: pelicanProps,

  do: pelicanTasks,

  ask: pelicanQuestions,

  complete: pelicanSequences,
};
