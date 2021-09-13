const { execSync } = require('child_process');
const { Base } = require('./base');

const { clean } = require('../string');

class K8s extends Base {
  /**
   * Remotely run a command from local PC via SSH connecting to Kubernetes cluster
   * @param service
   * @param cmd
   * @param cleanResult lambda(string) => string cleans result string
   * @returns {*}
   */
  runCommand(cmd, service = undefined, cleanResult = null) {
    cleanResult = cleanResult || clean;
    if (process.env.GEN3_HOME) {
      // eslint-disable-line no-template-curly-in-string
      const sourceCmd = `source "${process.env.GEN3_HOME}/gen3/lib/utils.sh"`;
      const gen3LoadCmd = 'gen3_load "gen3/gen3setup"';
      const namespace = process.env.NAMESPACE;
      let fullCommand = 'undefined';
      try {
        if (service === undefined) {
          fullCommand = `${sourceCmd}; ${gen3LoadCmd}; ${cmd}`;
        } else {
          fullCommand = `${sourceCmd}; ${gen3LoadCmd}; g3kubectl exec $(gen3 pod ${service} ${namespace}) -- ${cmd}`;
        }
        return cleanResult(execSync(
          fullCommand,
          { shell: '/bin/bash' },
        ).toString('utf8'));
      } catch (err) {
        const message = `ERROR: something went wrong with: ${fullCommand}`;
        console.log(`${message}\nDetails: ${err}`);
        return message;
      }
    }
    throw Error('Env var GEN3_HOME is not defined - required for loading gen3 tools');
  }
}

module.exports = { K8s };
