const mdsProps = require('./mdsProps.js');
const mdsTasks = require('./mdsTasks.js');
const mdsQuestions = require('./mdsQuestions.js');

/**
 * MDS Service
 */
module.exports = {
  props: mdsProps,
  do: mdsTasks,
  ask: mdsQuestions,
};
