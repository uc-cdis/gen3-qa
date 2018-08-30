const Helper = codecept_helper;
const commonsHelper = require('./actors/commonsHelper.js');
const usersHelper = require('./actors/usersHelper');

class CDISHelper extends Helper {
  _beforeSuite(suite) {
    const helper = this.helpers.WebDriverIO;
    // get the session id for the web driver
    global.seleniumSessionId = helper.browser.requestHandler.sessionID;
    // if not doing an API test, set the access token cookie
    if (!(suite.title.indexOf('API') >= 0)) {
      helper.amOnPage('');
      const access_token = usersHelper.mainAcct.accessToken;
      helper.setCookie({ name: 'access_token', value: access_token });
    }
  }

  async _failed(test_result) {
    // append health of services to error stack
    const health_check = await commonsHelper.makeHealthCheck();
    test_result.err.stack += '\n\nServices Health Check:';
    Promise.all(health_check).then(res => {
      test_result.err.stack += res;
    });
  }
}

module.exports = CDISHelper;
