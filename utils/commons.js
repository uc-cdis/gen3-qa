/**
 * A module providing utility functions for high level commons info
 * @module commons
 */

const request = require('request');
const user = require('./user');

class Commons{
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
    }
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
    const projectForm = {
      url: `${endpoint}${programName}/`,
      method: 'POST',
      headers: user.mainAcct.accessTokenHeader,
      form: JSON.stringify(Commons.project),
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
      endpoint =>
        new Promise((resolve) => {
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
}

module.exports = { Commons };
