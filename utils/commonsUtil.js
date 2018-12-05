/**
 * A module providing utility functions for high level commons info
 * @module commonsUtil
 */

const request = require('request');
const { execSync } = require('child_process');

const usersUtil = require('./usersUtil');

const inJenkins = (process.env.JENKINS_HOME !== '' && process.env.JENKINS_HOME !== undefined);

/**
 * Gets commons username from a namespace
 * @param {string} namespace
 * @returns {string}
 */
function userFromNamespace(namespace) {
  return namespace === 'default' ? 'qaplanetv1' : namespace;
}

module.exports = {
  get program() {
    const programName = 'jnkns';
    return {
      name: programName,
      type: 'program',
      dbgap_accession_number: programName,
    };
  },

  project: {
    type: 'project',
    code: 'jenkins',
    name: 'jenkins',
    dbgap_accession_number: 'jenkins',
    state: 'open',
    releasable: true,
  },

  /**
   * Attempts to create a program and project. If already exists does nothing.
   * @returns {Promise<any>}
   */
  async createProgramProject() {
    // add program and project
    const hostname = process.env.HOSTNAME;
    const endpoint = `https://${hostname}/api/v0/submission/`;
    const programName = this.program.name;

    const programForm = {
      url: endpoint,
      method: 'POST',
      headers: usersUtil.mainAcct.accessTokenHeader,
      form: JSON.stringify(this.program),
    };
    const projectForm = {
      url: `${endpoint + programName}/`,
      method: 'POST',
      headers: usersUtil.mainAcct.accessTokenHeader,
      form: JSON.stringify(this.project),
    };

    return new Promise((resolve, reject) => {
      request.post(programForm, (error, response, body) => {
        if (error) {
          reject(error);
        }
        if (!response || response.statusCode !== 200) {
          reject(body);
        } else {
          request.post(projectForm, (err, res, bod) => {
            if (err) {
              reject(err);
            }
            if (!res || res.statusCode !== 200) {
              reject(bod);
            } else {
              resolve();
            }
          });
        }
      });
    });
  },

  /**
   * Hit commons service health endpoints for health check
   * @returns {Promise<string>[]} Array of strings with health status for each service
   */
  makeHealthCheck() {
    const endpoints = {
      sheepdog: '/api/_status',
      peregrine: '/peregrine/_status',
      portal: '/',
      fence: '/user/jwt/keys',
    };
    const healthResults = Object.values(endpoints).map(
      endpoint =>
        new Promise((resolve) => {
          request.get(
            `https://${process.env.HOSTNAME}${endpoint}`,
            (error, res) => {
              resolve(
                `${`\nHealth ${endpoint}`.padEnd(30)}: ${res.statusCode}`,
              );
            },
          );
        }),
    );
    return healthResults;
  },

  /**
   * Generates a child process and runs the given command in a kubernetes namespace
   * @param {string} cmd - command to execute in the commons
   * @param {string} namespace - namespace to execute command in
   * @returns {string}
   */
  runCommand(cmd, namespace) {
    // if in jenkins, load gen3 tools before running command
    // if not in jenkins, ssh into commons and source bashrc before command
    console.log(`Running command: ${cmd}`);
    if (inJenkins) {
      if (process.env.GEN3_HOME) {
        const sourceCmd = `source "${process.env.GEN3_HOME}/gen3/lib/utils.sh"`; // eslint-disable-line no-template-curly-in-string
        const gen3LoadCmd = 'gen3_load "gen3/gen3setup"';
        const out = execSync(`${sourceCmd}; ${gen3LoadCmd}; ${cmd}`, { shell: '/bin/bash' });
        return out.toString('utf8');
      }
      throw Error('Env var GEN3_HOME is not defined - required for loading gen3 tools');
    }
    const commonsUser = userFromNamespace(namespace);
    const out = execSync(`ssh ${commonsUser}@cdistest.csoc 'set -i; source ~/.bashrc; ${cmd}'`, { shell: '/bin/sh' });
    return out.toString('utf8');
  },

  /**
   * Backup the current User Access into a file
   *  Note: Generates a child process and runs the given command in a kubernetes namespace
   * @param {string} backupFile - name of file to backup to
   * @returns {string}
   */
  backupUserYaml(backupFile) {
    this.runCommand(`rm -f ~/${backupFile}`, process.env.NAMESPACE);

    const cmd = `g3kubectl get configmap fence -o json | jq -r '.data."user.yaml"' > ~/${backupFile}`;
    const res = this.runCommand(cmd, process.env.NAMESPACE);
    return res;
  },

  /**
   * scp the given file to the remote environment
   *  Note: Generates a child process and runs the given command in a kubernetes namespace
   * @param {string} file - name of file to scp
   * @returns {string}
   */
  scpFile(file) {
    const commonsUser = userFromNamespace(process.env.NAMESPACE);
    const cmd = `scp ${file} ${commonsUser}@cdistest.csoc:~/${file}`;
    const res = execSync(cmd);
    return res.toString('utf8');
  },

  /**
   * Sets the configured User Access in the remote environment to be the provided filename
   * WARNING: It is recommended to run backupUserYaml() first. If you're transfering a
   *          User Access file, you'll need to use scpFile()
   * Note: Generates a child process and runs the given command in a kubernetes namespace
   * @param {string} useryaml - name of User Access file to set as main user.yaml
   * @returns {string}
   */
  setUserYaml(useryaml) {
    this.runCommand(`rm -f ~/user.yaml`, process.env.NAMESPACE);
    this.runCommand(`cp ~/${useryaml} ~/user.yaml`, process.env.NAMESPACE);

    var cmd = `gen3 update_config fence ~/user.yaml`;
    const res = this.runCommand(cmd, process.env.NAMESPACE);
    return res;
  },

  /**
   * Run given job and wait for it to complete
   * NOTE: Generates a child process and runs the given command in a kubernetes namespace
   * @param {string} jobName - name of k8s job to run in remote environment
   * @returns {string}
   */
  runJob(jobName) {
    const cmd = `gen3 runjob ${jobName} && kubectl wait --for=condition=complete --timeout=30s job/${jobName}`;
    const res = this.runCommand(cmd, process.env.NAMESPACE);
    return res;
  }
};
