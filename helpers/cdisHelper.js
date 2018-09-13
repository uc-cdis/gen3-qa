const Helper = codecept_helper; // eslint-disable-line
const commonsHelper = require('../utils/commonsUtil.js');
const usersHelper = require('../utils/usersUtil');

class CDISHelper extends Helper {
  _beforeSuite(suite) {
    const helper = this.helpers.WebDriverIO;
    // get the session id for the web driver
    global.seleniumSessionId = helper.browser.requestHandler.sessionID;
    // if not doing an API test, set the access token cookie
    if (!(suite.title.indexOf('API') >= 0)) {
      helper.amOnPage('');
      const accessToken = usersHelper.mainAcct.accessToken;
      helper.setCookie({ name: 'access_token', value: accessToken });
    }
  }

  async _failed(testResult) { // eslint-disable-line class-methods-use-this
    // append health of services to error stack
    const healthCheck = await commonsHelper.makeHealthCheck();
    testResult.err.stack += '\n\nServices Health Check:';
    Promise.all(healthCheck).then((res) => {
      testResult.err.stack += res;
    });
  }
}

module.exports = CDISHelper;
