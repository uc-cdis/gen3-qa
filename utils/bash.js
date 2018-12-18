/**
 * A module providing utility functions for high level commons info
 * @module commonsUtil
 */

const { K8s } = require('./commanders/k8s');
const { SshK8s } = require('./commanders/sshk8s');
const { Docker } = require('./commanders/docker');
const { ENV_TYPE, envVal } = require('./env');

class Bash{
  constructor() {
    this.commander = this.getCommander();
  }

  getCommander() {
    if (envVal === ENV_TYPE.JENKINS)
      return new K8s();
    if (envVal === ENV_TYPE.LOCAL_AGAISNT_GEN3_K8S)
      return new SshK8s();
    if (envVal === ENV_TYPE.LOCAL_AGAINST_DOCKER)
      return new Docker();
  }

  setupService(appName) {
    return this.commander.setupService(appName);
  }

  getAppStatus(appName) {
    return this.commander.getAppStatus(appName);
  }

  runJob(jobName, args='') {
    return this.commander.runJobAndWait(jobName, args);
  }

  /**
   * Generates a child process and runs the given command in a kubernetes namespace
   * @param {string} cmd - command to execute in the commons
   * @param {string} service - service name of pod in which command is run. undefined for running in admin vm
   * @returns {string}
   */
  runCommand(cmd, service=undefined) {
    return this.commander.runCommand(cmd, service);
  }
}

module.exports = { Bash };
