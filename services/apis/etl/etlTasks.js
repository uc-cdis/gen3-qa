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
    try {
      if (index) {
        const res = bash.runCommand(`curl -X DELETE -s ${etlProps.endpoints.root}/*${index}*`, 'aws-es-proxy-deployment');
        if (res.startsWith('HTTP/1.1 200 OK')) {
          return true;
        }
      } else {
        console.error(`ERROR: ignoring deleteIndices on invalid index key: ${index}`);
      }
      return false;
    } catch (ex) {
      // do not freak out if esproxy-service is not running
      return false;
    }
  },

  /**
   * Check if an alias exists
   * @param {string} alias - name of alias need to be checked
   * @returns {boolean}
   */
  existAlias(alias) {
    try {
      let res = bash.runCommand(`curl -I -s ${etlProps.endpoints.alias}/${alias}`, 'aws-es-proxy-deployment');
      if (res.startsWith('HTTP/1.1 200 OK')) {
        return true;
      }
      return false;
    } catch (ex) {
      // do not freak out if esproxy-service is not running
      return false;
    }
  },

  /**
   * Get index from alias
   * @param {string} alias - name of alias need to be checked
   * @returns {string}
   */
  getIndexFromAlias(alias) {
    try {
      let res = bash.runCommand(`curl -X GET -s ${etlProps.endpoints.alias}/${alias}`, 'aws-es-proxy-deployment');
      return Object.keys(JSON.parse(res))[0];
    } catch (ex) {
      // do not freak out if esproxy-service is not running
      return [];
    }

  },

  /**
   * Get content of index specified by index's name
   * @param {string} index - name of index to be queried
   * @returns {object}
   */
  getIndex(index) {
    try {
      let res = bash.runCommand(`curl -X GET -s ${etlProps.endpoints.root}/${index}`, 'arranger-deployment');
      return JSON.parse(res);
    } catch (ex) {
      // do not freak out if esproxy-service is not running
      return null;
    }

  },

  runSubmissionJob() {
    bash.runJob(`gentestdata`,
      `TEST_PROGRAM jnkns TEST_PROJECT jenkins MAX_EXAMPLES 100 SUBMISSION_USER ${user.mainAcct.username}`);
  },

  runETLJob() {
    return bash.runJob(`etl`);
  },
};
