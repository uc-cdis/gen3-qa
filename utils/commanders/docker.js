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
   * @returns {*}
   */
  runCommand(cmd, service=undefined) {
    if (service === undefined)
      return clean(execSync(`docker exec ${cmd}`, { shell: '/bin/bash' }).toString('utf8'));
    else
      return clean(execSync(`docker exec ${service}-service ${cmd}`, { shell: '/bin/bash' }).toString('utf8'));
  }
}

module.exports = { Docker };
