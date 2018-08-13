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
} = require('./steps/utilSteps');

class CDISHelper extends Helper {
  _init() {
    // add program and project
    let accessTokenHeader = getAccessTokenHeader();
    let hostname = process.env.HOSTNAME;

    let endpoint = "https://" + hostname + "/api/v0/submission/";

    let program_name = getProgramName();
    let program = {
      name: program_name, type: 'program',
      dbgap_accession_number: program_name
    };
    let project = {
      type: "project",
      code: "test",
      name: "test",
      dbgap_accession_number: "test",
      state: "open"
    };

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

    request.post(
      program_form,
      (error, response, body) => {
        console.log("Create Program: ", body);
        request.post(
          project_form,
          (error, response, body) => {
            console.log("Create Project: ", body);
            return expect(JSON.parse(body)).to.have.property("entities")
          })
      }
    )
  }

  _beforeSuite(suite) {
    if (!suite.title.indexOf('API') >= 0)
    {
      const helper = this.helpers['WebDriverIO'];
      helper.amOnPage('');
      let access_token = process.env.ACCESS_TOKEN;
      helper.setCookie({name: 'access_token', value: access_token});
    }
  }

  // http://webdriver.io/api/protocol/elements.html
  elements(selector) {
    const browser = this.helpers['WebDriverIO'].browser;
    return browser.elements(selector)
      .then((res) => {
        return res.value;
      })
      .catch((err) => {
        return null;
      });
  }

  elementIdText(id) {
    const browser = this.helpers['WebDriverIO'].browser;
    return browser.elementIdText(id)
      .then((res) => {
        return res.value;
      })
      .catch((err) => {
        return null;
      });
  }

  // http://webdriver.io/api/protocol/elementIdClick.html
  elementIdClick(id) {
    const browser = this.helpers['WebDriverIO'].browser;
    return browser.elementIdClick(id)
      .then()
      .catch((err) => {
        return null;
      });
  }

  // http://webdriver.io/api/protocol/elementIdElement.html
  elementIdElement(id, selector) {
    const browser = this.helpers['WebDriverIO'].browser;
    return browser.elementIdElement(id, selector)
      .then((res) => {
        return res.value;
      })
      .catch((err) => {
        return null;
      });
  }

  debug() {
    const browser = this.helpers['WebDriverIO'].browser;
    browser.debug();
  }
}

module.exports = CDISHelper;
