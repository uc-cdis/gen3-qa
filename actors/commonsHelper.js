const request = require('request');

const usersHelper = require('./usersHelper');

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

  async createProgramProject() {
    // add program and project
    const hostname = process.env.HOSTNAME;
    const endpoint = `https://${hostname}/api/v0/submission/`;
    const programName = this.program.name;

    const programForm = {
      url: endpoint,
      method: 'POST',
      headers: usersHelper.mainAcct.accessTokenHeader,
      form: JSON.stringify(this.program),
    };
    const projectForm = {
      url: `${endpoint + programName}/`,
      method: 'POST',
      headers: usersHelper.mainAcct.accessTokenHeader,
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

  async makeHealthCheck() {
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
};
