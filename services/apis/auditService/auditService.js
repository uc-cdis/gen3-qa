const auditServiceProps = require('./auditServiceProps.js');
const auditServiceTasks = require('./auditServiceTasks.js');

module.exports = {
  props: auditServiceProps,
  do: auditServiceTasks,
};
