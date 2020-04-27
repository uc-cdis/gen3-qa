const indexingProps = require('./indexingProps.js');
const indexingTasks = require('./indexingTasks.js');

/**
 * indexing service
 */
module.exports = {
  props: indexingProps,
  do: indexingTasks,
};
