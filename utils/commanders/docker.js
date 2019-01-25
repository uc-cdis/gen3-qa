const { Base } = require('./base');

const { execSync } = require('child_process');
const { clean } = require('../string');

class Docker extends Base {
  runJobAndWait(jobName, args) {
    console.error('Not supported yet');
  }

  getAppStatus() {
    console.error('Not supported yet');
  }

  setupService(appName) {
    console.error('Not supported yet');
  }

  /**
   * Remotely run a command from local PC via SSH connecting to Kubernetes cluster
   * @param service
   * @param cmd
   * @param cleanResult lambda(string) => string cleans result string
   * @returns {*}
   */
  runCommand(cmd, service=undefined, cleanResult=null) {
    cleanResult = cleanResult || clean;
    if (service === undefined) {
      return cleanResult(execSync(`docker exec ${cmd}`, { shell: '/bin/bash' }).toString('utf8'));
    } else {
      return cleanResult(execSync(`docker exec ${service}-service ${cmd}`, { shell: '/bin/bash' }).toString('utf8'));
    }
  }
}

module.exports = { Docker };
