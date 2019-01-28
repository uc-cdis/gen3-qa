const { Base } = require("./base");

const { execSync } = require('child_process');
const { clean } = require('../string');

class K8s extends Base {
  /**
   * Remotely run a command from local PC via SSH connecting to Kubernetes cluster
   * @param service
   * @param cmd
   * @param cleanResult lambda(string) => string cleans result string
   * @returns {*}
   */
  runCommand(cmd, service=undefined, cleanResult=null) {
    cleanResult = cleanResult || clean;
    if (process.env.GEN3_HOME) {
      // eslint-disable-line no-template-curly-in-string
      const sourceCmd = `source "${process.env.GEN3_HOME}/gen3/lib/utils.sh"`;
      const gen3LoadCmd = 'gen3_load "gen3/gen3setup"';
      const namespace = process.env.NAMESPACE;
      if (service === undefined) {
        return cleanResult(execSync(
          `${sourceCmd}; ${gen3LoadCmd}; ${cmd}`,
          { shell: '/bin/bash' }
        ).toString('utf8'));
      } else {
        return cleanResult(execSync(
          `${sourceCmd}; ${gen3LoadCmd}; g3kubectl exec $(gen3 pod ${service} ${namespace}) -- ${cmd}`,
          { shell: '/bin/bash' }
        ).toString('utf8'));
      }
    }
    throw Error('Env var GEN3_HOME is not defined - required for loading gen3 tools');
  }
}

module.exports = { K8s };
