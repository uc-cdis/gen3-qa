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
     * Clean up indices created from an ETL run
     */
  cleanUpIndices() {
    const etlMappingNames = bash.runCommand('g3kubectl get cm etl-mapping -o jsonpath=\'{.data.etlMapping\\.yaml}\' | yq \'.mappings[].name\' | xargs').split(' ');

    const aliases = [];
    etlMappingNames.forEach((etlMappingName) => {
      aliases.push(etlMappingName, `${etlMappingName}-array-config`);
    });

    aliases.forEach((alias) => {
      this.deleteIndices(`${alias}_0`);
      if (this.existAlias(alias)) {
        const index = this.getIndexFromAlias(alias);
        if (index === '') {
          console.warn(`WARNING: could not get index for alias ${alias}, meaning index versions associated with ${alias} could not be deleted`);
        } else {
          console.log(`deleting all index versions associated with alias ${alias}`);
          this.deleteAllIndexVersions(index);
        }
      }
    });
  },

  /**
     * Check if an alias exists
     * @param {string} index - name of index need to be checked
     * @returns {boolean}
     */
  deleteIndices(index) {
    try {
      if (index) {
        const res = bash.runCommand(`gen3 es port-forward > /dev/null 2>&1 && sleep 5s && curl -X DELETE -s $ESHOST/${index}`);
        if (res.includes('"acknowledged":true')) {
          if (process.env.DEBUG === 'true') {
            console.log(`index ${index} was successfully deleted`);
          }
          return true;
        }
        // warn here instead of error because deleteAllIndexVersions
        // iteratively deletes older versions of an index until there are no
        // more versions left to delete (i.e. not a problem in that case)
        console.warn(`WARNING: index ${index} could not be deleted:\n${res}`);
      } else {
        console.error(`ERROR: ignoring deleteIndices on invalid index key: ${index}`);
      }
    } catch (ex) {
      // do not freak out if esproxy-service is not running
      console.error(`ERROR: could not execute bash command to delete index ${index}\n${ex}`);
    }
    return false;
  },

  /**
     * Delete the current and all previous versions of an index
     * @param {string} index - current index to delete
     */
  deleteAllIndexVersions(index) {
    const match = index.match(RegExp('(.*)_([0-9]+)$'));
    const prefix = match[1];
    let number = Number.parseInt(match[2], 10);
    for (; number >= 0; number -= 1) {
      const indexToDelete = `${prefix}_${number}`;
      if (!this.deleteIndices(`${indexToDelete}`)) {
        break;
      }
    }
  },

  /**
     * Check if an alias exists
     * @param {string} alias - name of alias need to be checked
     * @returns {boolean}
     */
  existAlias(alias) {
    try {
      const res = bash.runCommand(`gen3 es port-forward > /dev/null 2>&1 && sleep 5s && curl -I -s $ESHOST/_alias/${alias}`);
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
      const res = bash.runCommand(`gen3 es port-forward > /dev/null 2>&1 && sleep 5s && curl -X GET -s $ESHOST/_alias/${alias}`);
      return Object.keys(JSON.parse(res))[0];
    } catch (ex) {
      // do not freak out if esproxy-service is not running
      return '';
    }
  },

  /**
     * Get content of index specified by index's name
     * @param {string} index - name of index to be queried
     * @returns {object}
     */
  getIndex(index) {
    try {
      const res = bash.runCommand(`curl -X GET -s ${etlProps.endpoints.root}/${index}`, 'arranger-deployment');
      return JSON.parse(res);
    } catch (ex) {
      // do not freak out if esproxy-service is not running
      return null;
    }
  },

  runSubmissionJob() {
    bash.runJob('gentestdata',
      `TEST_PROGRAM jnkns TEST_PROJECT jenkins MAX_EXAMPLES 100 SUBMISSION_USER ${user.mainAcct.username}`);
  },

  runETLJob() {
    return bash.runJob('etl');
  },
};
