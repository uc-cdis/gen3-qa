const chai = require('chai');

const expect = chai.expect;
const request = require('request');

const username = process.env.INDEX_USERNAME;
const password = process.env.INDEX_PASSWORD;
const indexAuth = Buffer.from(`${username}:${password}`).toString('base64');

module.exports = {
  validAccessTokenHeader: {
    Accept: 'application/json',
    Authorization: `bearer ${process.env.ACCESS_TOKEN}`,
  },

  expiredAccessTokenHeader: {
    Accept: 'application/json',
    Authorization: `bearer ${process.env.EXPIRED_ACCESS_TOKEN}`,
  },

  validIndexAuthHeader: {
    Accept: 'application/json',
    'Content-Type': 'application/json; charset=UTF-8',
    Authorization: `Basic ${indexAuth}`,
  },

  get program() {
    const program_name = process.env.HOSTNAME.startsWith('qa') ? 'QA' : 'DEV';
    return {
      name: program_name,
      type: 'program',
      dbgap_accession_number: program_name,
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

  createProgramProject() {
    // add program and project
    const hostname = process.env.HOSTNAME;
    const endpoint = `https://${hostname}/api/v0/submission/`;
    const program_name = this.program.name;

    const program_form = {
      url: endpoint,
      method: 'POST',
      headers: this.validAccessTokenHeader,
      form: JSON.stringify(this.program),
    };
    const project_form = {
      url: `${endpoint + program_name}/`,
      method: 'POST',
      headers: this.validAccessTokenHeader,
      form: JSON.stringify(this.project),
    };

    return request.post(program_form, (error, response, body) => {
      console.log('Create Program: ', body);
      return request.post(project_form, (error, response, body) => {
        console.log('Create Project: ', body);
        return expect(JSON.parse(body)).to.have.property('entities');
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
    const health_results = Object.values(endpoints).map(
      endpoint =>
        new Promise((resolve, reject) => {
          request.get(
            `https://${process.env.HOSTNAME}${endpoint}`,
            (error, res, body) => {
              resolve(
                `${`\nHealth ${endpoint}`.padEnd(30)}: ${res.statusCode}`,
              );
            },
          );
        }),
    );
    return health_results;
  },
};
