const auditServiceProps = require('./auditServiceProps.js');
const auditServiceTasks = require('./auditServiceTasks.js');

/**
 * pidgin Service
 */
module.exports = {
  props: auditServiceProps,
  do: auditServiceTasks,
};
