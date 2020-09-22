const { execSync } = require('child_process');
const { clean } = require('../string');
const { Base } = require('./base');

/**
 * Gets commons username from a namespace
 * @param {string} namespace
 * @returns {string}
 */
function userFromNamespace(namespace) {
  return namespace === 'default' ? 'qaplanetv1' : namespace;
}

class SshK8s extends Base {
  /**
   * Remotely run a command from local PC via SSH connecting to Kubernetes cluster
   * @param service
   * @param cmd
   * @param cleanResult lambda(string) => string cleans result string
   * @returns {*}
   */
  runCommand( // eslint-disable-line class-methods-use-this
    cmd,
    service = undefined,
    cleanResult = null,
  ) {
    cleanResult = cleanResult || clean; // eslint-disable-line no-param-reassign
    const namespace = process.env.NAMESPACE;
    const commonsUser = userFromNamespace(namespace);
    if (service === undefined) {
      return cleanResult(execSync(`ssh ${commonsUser}@cdistest_dev.csoc 'export GEN3_HOME=$HOME/cloud-automation && source "$GEN3_HOME/gen3/gen3setup.sh"; source ~/.bashrc; ${cmd}'`,
        { shell: '/bin/bash' }).toString('utf8'));
    }
    let result = '';
    if (process.env.RUNNING_LOCAL === 'true') {
      let kubeconfigPath = process.env.vpc_name === undefined ? 'Gen3Secrets' : process.env.vpc_name;
      result = cleanResult(execSync(
        `ssh ${commonsUser}@cdistest_dev.csoc 'export GEN3_HOME=$HOME/cloud-automation && source "$GEN3_HOME/gen3/gen3setup.sh"; export KUBECONFIG=/home/${process.env.NAMESPACE}/${kubeconfigPath}/kubeconfig; g3kubectl exec $(gen3 pod ${service} ${namespace}) -- ${cmd}'`,
        { shell: '/bin/sh' },
      ).toString('utf8'));
    } else {
      result = cleanResult(execSync(
        `ssh ${commonsUser}@cdistest_dev.csoc 'export GEN3_HOME=$HOME/cloud-automation && source "$GEN3_HOME/gen3/gen3setup.sh"; g3kubectl exec $(gen3 pod ${service} ${namespace}) -- ${cmd}'`,
        { shell: '/bin/sh' },
      ).toString('utf8'));
    }
    return result;
  }
}

module.exports = { SshK8s };
