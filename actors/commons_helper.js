'use strict';

let chai = require('chai');
let expect = chai.expect;
let request = require('request');

let username = process.env.INDEX_USERNAME;
let password = process.env.INDEX_PASSWORD;
let indexAuth = Buffer.from(`${username}:${password}`).toString('base64');

module.exports = {
  validAccessTokenHeader: {
    'Accept': 'application/json',
    'Authorization': `bearer ${process.env.ACCESS_TOKEN}`
  },

  expiredAccessTokenHeader: {
    'Accept': 'application/json',
    'Authorization': `bearer ${process.env.EXPIRED_ACCESS_TOKEN}`
  },

  validIndexAuthHeader: {
    'Accept': 'application/json',
    'Content-Type': 'application/json; charset=UTF-8',
    'Authorization': `Basic ${indexAuth}`
  },

  get program() {
    let program_name = process.env.HOSTNAME.startsWith('qa') ? 'QA' : 'DEV';
    return {
      name: program_name, type: 'program',
      dbgap_accession_number: program_name
    };
  },

  project: {
    type: "project",
    code: "test",
    name: "test",
    dbgap_accession_number: "test",
    state: "open",
    releasable: true
  },

  createProgramProject() {
    // add program and project
    let hostname = process.env.HOSTNAME;
    let endpoint = "https://" + hostname + "/api/v0/submission/";
    let program_name = this.program.name;

    let program_form = {
      url: endpoint,
      method: 'POST',
      headers: this.validAccessTokenHeader,
      form: JSON.stringify(this.program)
    };
    let project_form = {
      url: endpoint + program_name + "/",
      method: 'POST',
      headers: this.validAccessTokenHeader,
      form: JSON.stringify(this.project)
    };

    return request.post(
      program_form,
      (error, response, body) => {
        console.log("Create Program: ", body);
        return request.post(
          project_form,
          (error, response, body) => {
            console.log("Create Project: ", body);
            return expect(JSON.parse(body)).to.have.property("entities")
          })
      }
    )
  },

  async makeHealthCheck() {
    let health_results = '';
    let endpoints = {
      sheepdog: "/api/_status",
      peregrine: "/peregrine/_status",
      portal: "/",
      fence: "/user/jwt/keys"
    };
    let promises = Object.values(endpoints).map((endpoint) => {
      return request.get(`https://${process.env.HOSTNAME}${endpoint}`)
        .then((res) => {
          health_results += `\nHealth ${endpoint}`.padEnd(30) + `: ${res.statusCode}`
        });
    });
    await Promise.all(promises);
    return health_results;
  }
};