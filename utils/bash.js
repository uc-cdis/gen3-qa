/**
 * A module providing utility functions for high level commons info
 * @module bash
 */

const { K8s } = require('./commanders/k8s');
const { SshK8s } = require('./commanders/sshk8s');
const { Docker } = require('./commanders/docker');
const { NullCommander } = require('./commanders/null');
const { ENV_TYPE, envVal } = require('./env');

class Bash {
  constructor() {
    this.commander = this.getCommander();
  }

  getCommander() {
    if (envVal === ENV_TYPE.JENKINS) {
      return new K8s();
    }
    if (envVal === ENV_TYPE.LOCAL_AGAINST_GEN3_K8S) {
      return new SshK8s();
    }
    if (envVal === ENV_TYPE.LOCAL_AGAINST_DOCKER) {
      return new Docker();
    }
    return new NullCommander();
  }

  runJob(jobName, args = '', wait = true) {
    if (wait) {
      return this.commander.runJobAndWait(jobName, args);
    }
    return this.commander.runJob(jobName, args);
  }

  /**
   * Generates a child process and runs the given command in a kubernetes namespace
   * @param {string} cmd - command to execute in the commons
   * @param {string} service - service name of pod in which command is run. undefined for running in admin vm
   * @returns {string}
   */
  runCommand(cmd, service = undefined, clean = null) {
    return this.commander.runCommand(cmd, service, clean);
  }
}

/**
 * pop off the last line to avoid log messages - ignore empty lines
 * @param {string} str
 */
function takeLastLine(str) {
  return str.split(/[\r\n]+/).filter((line) => !!line.trim()).pop();
}

module.exports = { Bash, takeLastLine };
