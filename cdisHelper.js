'use strict';

let Helper = codecept_helper;
const commons_helper = require('./actors/commons_helper.js');

class CDISHelper extends Helper {
  async _init() {
    await commons_helper.createProgramProject();
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
    let health_check = await commons_helper.makeHealthCheck();
    test_result.err.stack += '\n\nServices Health Check:';
    test_result.err.stack += health_check;
  }
}

module.exports = CDISHelper;
