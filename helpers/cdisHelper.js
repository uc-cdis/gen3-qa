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

  async _after() {
    const helper = this.helpers.WebDriverIO;
    try {
      await helper.browser.close();
    } catch (err) {
      console.log(`${new Date()} [WARN]: Something weird happened: ${err}`);
      // don't let the exception bubble up
      // avoid erroneous CI failures
    }
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
