const { clean } = require('../string');

class Base {
  runJobAndWait(jobName, args) {
    this.runCommand(`gen3 job run ${jobName} -w ${args}`);
    return this.runCommand(`g3kubectl get jobs ${jobName} -o json | jq -r '.status.succeeded'`) === '1';
  }

  getAppStatus(appName) {
    return this.runCommand(`g3kubectl get pods --selector=app=${appName} -o json | jq -r '.items[].status.phase'`);
  }


  /**
   * Run a command from inside Kubernetes cluster
   * @param service
   * @param cmd
   * @returns {*}
   */
  runCommand(cmd, service=undefined, cleanResult=clean) {
    if (process.env.GEN3_HOME) {
      // eslint-disable-line no-template-curly-in-string
      const sourceCmd = `source "${process.env.GEN3_HOME}/gen3/lib/utils.sh"`;
      const gen3LoadCmd = 'gen3_load "gen3/gen3setup"';
      const namespace = process.env.NAMESPACE;
      if (service === undefined)
        return cleanResult(execSync(
          `${sourceCmd}; ${gen3LoadCmd}; ${cmd}`,
          { shell: '/bin/bash' }
        ).toString('utf8'));
      else
        return cleanResult(execSync(
          `${sourceCmd}; ${gen3LoadCmd}; g3kubectl exec $(gen3 pod ${service} ${namespace}) -- ${cmd}`,
          { shell: '/bin/bash' }
        ).toString('utf8'));
    }
    throw Error('Env var GEN3_HOME is not defined - required for loading gen3 tools');
  }
}

module.exports = { Base };
