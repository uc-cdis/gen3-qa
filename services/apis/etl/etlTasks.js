const etlProps = require('./etlProps.js');
const user = require('../../../utils/user.js');
const { Bash } = require('../../../utils/bash.js');

const I = actor();
const bash = new Bash();

/**
 * ETL Tasks
 */
module.exports = {
  /**
   * Check if an alias exists
   * @param {string} index - name of index need to be checked
   * @returns {boolean}
   */
  deleteIndices(index) {
    let res = bash.runCommand(`curl -X DELETE -s ${etlProps.endpoints.root}/*${index}*`, 'arranger-deployment');
    if (res.startsWith('HTTP/1.1 200 OK'))
      return true;
    return false;
  },

  /**
   * Check if an alias exists
   * @param {string} alias - name of alias need to be checked
   * @returns {boolean}
   */
  existAlias(alias) {
    let res = bash.runCommand(`curl -I -s ${etlProps.endpoints.alias}/${alias}`, 'arranger-deployment');
    if (res.startsWith('HTTP/1.1 200 OK'))
      return true;
    return false;
  },

  /**
   * Get index from alias
   * @param {string} alias - name of alias need to be checked
   * @returns {string}
   */
  getIndexFromAlias(alias) {
    let res = bash.runCommand(`curl -X GET -s ${etlProps.endpoints.alias}/${alias}`, 'arranger-deployment');
    return Object.keys(JSON.parse(res))[0];
  },

  /**
   * Get content of index specified by index's name
   * @param {string} index - name of index to be queried
   * @returns {object}
   */
  getIndex(index) {
    let res = bash.runCommand(`curl -X GET -s ${etlProps.endpoints.root}/${index}`, 'arranger-deployment');
    return JSON.parse(res);
  },

  runSubmissionJob() {
    bash.runJob(`gentestdata`,
      `TEST_PROGRAM jnkns TEST_PROJECT jenkins MAX_EXAMPLES 100 SUBMISSION_USER ${user.mainAcct.username}`);
  },

  rollSpark() {
    if (bash.getAppStatus(`spark`) === 'Running')
      return true;
    bash.setupService(`spark`);
    return true;
  },

  runETLJob() {
    return bash.runJob(`etl`);
  },
};
