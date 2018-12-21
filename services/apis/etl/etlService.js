const etlTasks = require('./etlTasks.js');
const etlQuestions = require('./etlQuestions.js');
const etlProps = require('./etlProps.js');
const etlSequences = require('./etlSequences.js');

/**
 * etl Service
 */
module.exports = {
  props: etlProps,
  do: etlTasks,
  ask: etlQuestions,
  complete: etlSequences,
};
