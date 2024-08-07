/**
 * A module providing utility functions for high level commons info
 * @module commons
 */

const request = require('request');
const path = require('path');
const user = require('./user');
const { Bash } = require('./bash');

const bash = new Bash();
const inJenkins = (process.env.JENKINS_HOME !== '' && process.env.JENKINS_HOME !== undefined);

class Commons {
  static get program() {
    const programName = 'jnkns';
    return {
      name: programName,
      type: 'program',
      dbgap_accession_number: programName,
    };
  }

  static get project() {
    return {
      type: 'project',
      code: 'jenkins',
      name: 'jenkins',
      dbgap_accession_number: 'jenkins',
      state: 'open',
      releasable: true,
    };
  }

  // these files exist in cloud automation repo, check there for details
  static get userAccessFiles() {
    return {
      newUserAccessFile2: 'test2_user.yaml', // used to modify access to integration tests users
    };
  }

  /**
   * Attempts to create a program and project. If already exists does nothing.
   * @returns {Promise<any>}
   */
  static async createProgramProject() {
    // add program and project
    const hostname = process.env.HOSTNAME;
    const endpoint = `https://${hostname}/api/v0/submission/`;
    const programName = Commons.program.name;

    const programForm = {
      url: `${endpoint}`,
      method: 'POST',
      headers: user.mainAcct.accessTokenHeader,
      form: JSON.stringify(Commons.program),
    };
    if (process.env.DEBUG === 'true') {
      console.log(`### ## programForm['headers']: ${JSON.stringify(programForm.headers)}`);
      console.log(`### ## programForm['url']: ${JSON.stringify(programForm.url)}`);
    }
    const projectForm = {
      url: `${endpoint}${programName}/`,
      method: 'POST',
      headers: user.mainAcct.accessTokenHeader,
      form: JSON.stringify(Commons.project),
    };
    if (process.env.DEBUG === 'true') {
      console.log(`### ## projectForm['headers']: ${JSON.stringify(projectForm.headers)}`);
    }
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
  }

  /**
   * Hit commons service health endpoints for health check
   * @returns {Promise<string>[]} Array of strings with health status for each service
   */
  static makeHealthCheck() {
    const endpoints = {
      sheepdog: '/api/_status',
      peregrine: '/peregrine/_status',
      portal: '/',
      fence: '/user/jwt/keys',
    };
    return Object.values(endpoints).map(
      (endpoint) => new Promise((resolve) => {
        request.get(
          `https://${process.env.HOSTNAME}${endpoint}`,
          (error, res) => {
            resolve(
              `${`\nHealth ${endpoint}`.padEnd(30)}: ${(res && res.statusCode) || error}`,
            );
          },
        );
      }),
    );
  }

  /**
   * Backup the current User Access into a file
   *  Note: Generates a child process and runs the given command in a kubernetes namespace
   * @param {string} backupFile - name of file to backup to
   * @returns {string}
   */
  static backupUserYaml(backupFile) {
    let dir;
    if (inJenkins) {
      dir = `${process.env.GEN3_HOME}/files/integration_testing`;
    } else {
      dir = '~/cloud-automation/files/integration_testing';
    }

    bash.runCommand(`rm -f ${dir}/${backupFile}`);

    const cmd = `g3kubectl get configmap fence -o json | jq -r '.data."user.yaml"' > ${dir}/${backupFile}`;
    const res = bash.runCommand(cmd);
    return res;
  }

  /**
   * Sets the configured User Access in the remote environment to be the provided filename
   * WARNING: It is recommended to run backupUserYaml() first
   * Note: Generates a child process and runs the given command in a kubernetes namespace
   * @param {string} useryaml - name of User Access file to set as main user.yaml
   * @returns {string}
   */
  static setUserYaml(useryaml) {
    /* let dir;
    if (inJenkins) {
      dir = `${process.env.GEN3_HOME}/files/integration_testing`;
    } else {
      dir = '~/cloud-automation/files/integration_testing';
    } */

    const dir = path.join(__dirname, '..', 'files');
    console.log(`*** NEW PATH FOR USER.YAML FILE: ${dir}`);
    bash.runCommand(`rm -f ${dir}/user.yaml`);
    bash.runCommand(`cp ${dir}/${useryaml} ${dir}/user.yaml`);

    const cmd = `gen3 update_config fence ${dir}/user.yaml`;
    const res = bash.runCommand(cmd);
    return res;
  }
}

module.exports = { Commons };
