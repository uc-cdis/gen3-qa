const Helper = codecept_helper; // eslint-disable-line
const { Commons } = require('../utils/commons');

class CDISHelper extends Helper {
  async _failed(testResult) { // eslint-disable-line class-methods-use-this
    // append health of services to error stack
    const healthCheck = await Commons.makeHealthCheck();
    testResult.err.stack += '\n\nServices Health Check:';
    Promise.all(healthCheck).then((res) => {
      testResult.err.stack += res;
    });
  }

  noTimeoutEnter() {
    const helper = this.helpers.WebDriverIO;
    try {
      helper.browser.keys('Enter');
    } catch (err) {
      // do nothing
    }
  }
}

module.exports = CDISHelper;
