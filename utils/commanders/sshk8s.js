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
    _cmd,
    service = undefined,
    cleanResult = null,
  ) {
    cleanResult = cleanResult || clean; // eslint-disable-line no-param-reassign
    const namespace = process.env.NAMESPACE;
    const commonsUser = userFromNamespace(namespace);
    const kubeconfigPath = process.env.vpc_name === undefined ? 'Gen3Secrets' : process.env.vpc_name;
    const kubeconfigDeclaration = process.env.RUNNING_LOCAL === 'true' ? `export KUBECONFIG=/home/${process.env.NAMESPACE}/${kubeconfigPath}/kubeconfig;` : '';

    // single quotes in the command must be escaped, because the command
    // is run inside single quotes; see below: shh [...] '[...] cmd'
    const cmd = _cmd.replace(/'/g, '\'"\'"\'');

    if (service === undefined) {
      return cleanResult(execSync(`ssh ${commonsUser}@cdistest_dev.csoc 'export GEN3_HOME=$HOME/cloud-automation && source "$GEN3_HOME/gen3/gen3setup.sh"; source ~/.bashrc; ${kubeconfigDeclaration} ${cmd}'`,
        { shell: '/bin/bash' }).toString('utf8'));
    }
    return cleanResult(execSync(
      `ssh ${commonsUser}@cdistest_dev.csoc 'export GEN3_HOME=$HOME/cloud-automation && source "$GEN3_HOME/gen3/gen3setup.sh"; ${kubeconfigDeclaration} g3kubectl exec $(gen3 pod ${service} ${namespace}) -- ${cmd}'`,
      { shell: '/bin/sh' },
    ).toString('utf8'));
  }
}

module.exports = { SshK8s };
