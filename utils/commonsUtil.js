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
    const programName = process.env.HOSTNAME.startsWith('qa') ? 'QA' : 'DEV';
    return {
      name: programName,
      type: 'program',
      dbgap_accession_number: programName,
    };
  },

  project: {
    type: 'project',
    code: 'test',
    name: 'test',
    dbgap_accession_number: 'test',
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
        if (response.statusCode !== 200) {
          reject(body);
        } else {
          request.post(projectForm, (err, res, bod) => {
            if (err) {
              reject(err);
            }
            if (res.statusCode !== 200) {
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
    if (inJenkins) {
      if (process.env.GEN3_HOME) {
        const sourceCmd = `source "${process.env.GEN3_HOME}/gen3/lib/utils.sh"`; // eslint-disable-line no-template-curly-in-string
        const gen3LoadCmd = 'gen3_load "gen3/gen3setup"';
        return execSync(`${sourceCmd}; ${gen3LoadCmd}; ${cmd}`, { shell: '/bin/bash' });
      }
      throw Error('Env var GEN3_HOME is not defined - required for loading gen3 tools');
    }
    const commonsUser = userFromNamespace(namespace);
    const out = execSync(`ssh ${commonsUser}@cdistest.csoc 'set -i; source ~/.bashrc; ${cmd}'`, { shell: '/bin/sh' });
    return out.toString('utf8');
  },
};
