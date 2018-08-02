'use strict';

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
let expect = chai.expect;
let request = require('request');

let Helper = codecept_helper;
const {
  getAccessTokenHeader,
  getProgramName,
  getProject
} = require('./steps/utilSteps');

const createProgramProject = function() {
  // add program and project
  let accessTokenHeader = getAccessTokenHeader();
  let hostname = process.env.HOSTNAME;

  let endpoint = "https://" + hostname + "/api/v0/submission/";

  let program_name = getProgramName();
  let program = {
    name: program_name, type: 'program',
    dbgap_accession_number: program_name
  };
  let project = getProject();

  let program_form = {
    url: endpoint,
    method: 'POST',
    headers: accessTokenHeader,
    form: JSON.stringify(program)
  };
  let project_form = {
    url: endpoint + program_name + "/",
    method: 'POST',
    headers: accessTokenHeader,
    form: JSON.stringify(project)
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
};

class CDISHelper extends Helper {
  async _init() {
    await createProgramProject();
  }

  _beforeSuite(suite) {
    const helper = this.helpers['WebDriverIO'];
    // get the session id for the web driver
    global.seleniumSessionId = helper.browser.requestHandler.sessionID;
    // if not doing an API test, set the access token cookie
    if (!(suite.title.indexOf('API') >= 0))
    {
      helper.amOnPage('');
      let access_token = process.env.ACCESS_TOKEN;
      helper.setCookie({name: 'access_token', value: access_token});
    }
  }

  async _failed(test_result) {
    // Check health of services
    const helper = this.helpers['REST'];

    let endpoints = {
      sheepdog: "/api/_status",
      peregrine: "/peregrine/_status",
      portal: "/",
      fence: "/user/jwt/keys"
    };
    test_result.err.stack += '\n\nServices Health Check:';
    let promises = Object.values(endpoints).map((endpoint) => {
      return helper.sendGetRequest(`https://${process.env.HOSTNAME}${endpoint}`)
        .then((res) => {
          test_result.err.stack += `\nHealth ${endpoint}`.padEnd(30) + `: ${res.statusCode}`
        });
    });
    await Promise.all(promises);
  }
}

module.exports = CDISHelper;
