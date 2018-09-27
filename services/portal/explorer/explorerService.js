const explorerTasks = require('./explorerTasks.js');
const explorerQuestions = require('./explorerQuestions.js');
const explorerProps = require('./explorerProps.js');
const explorerSequences = require('./explorerSequences.js');

/**
 * explorer Service
 */
module.exports = {
  props: explorerProps,

  do: explorerTasks,

  ask: explorerQuestions,

  complete: explorerSequences,
};
