class NullCommander {
  runJob(jobName, args) {
    throw new Error('NullCommander cannot run backend jobs');
  }

  runJobAndWait(jobName, args) {
    throw new Error('NullCommander cannot run backend jobs');
  }

  /**
   * Run a command from inside Kubernetes cluster
   * @param service
   * @param cmd
   * @returns {*}
   */
  runCommand(cmd, service = undefined, cleanResult = clean) {
    throw new Error('NullCommander cannot run backend commands');
  }
}

module.exports = { NullCommander };
