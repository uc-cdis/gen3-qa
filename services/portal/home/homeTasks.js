/* eslint-disable max-len */
const homeProps = require('./homeProps.js');
const portal = require('../../../utils/portal.js');
const { Bash } = require('../../../utils/bash.js');

const bash = new Bash();
const I = actor();

/**
 * home Tasks
 */
module.exports = {
  goToHomepage() {
    I.amOnPage(homeProps.path);
    console.log(`### ## testedEnv:${process.env.testedEnv}`);
    if (process.env.testedEnv.includes('covid19') || process.env.testedEnv.includes('pandemicresponsecommons') || process.env.testedEnv.includes('midrc')) {
      I.refreshPage();
    }
    // wait 2 sec to let the page fully loaded
    I.wait(2);
    if (process.env.DEBUG === 'true') {
      I.captureBrowserLog();
      I.saveScreenshot('Home_page_for_debugging.png');
    }
    portal.seeProp(homeProps.ready_cue, 60);
  },

  async systemUseMsg() {
    I.saveScreenshot("check_system_use_message.png");
    try {
        I.click(homeProps.systemUseAcceptButton.locator);
    } catch (error) {
      console.log(error);
    }
  },

  /**
   * Logs into windmill. Uses the "dev_login" cookie to tell fence
   * which username to use when mocking the login.
   * /!\ remember to logout after logging in or following tests will fail!
   */
  async login(username) {
    this.goToHomepage();
    await this.systemUseMsg();
    I.setCookie({ name: 'dev_login', value: username });
    portal.clickProp(homeProps.googleLoginButton);
  },

  /**
   * Logs out of windmill
   */
  async logout() {
    portal.clickProp(homeProps.logoutButton);
    await this.systemUseMsg();
  },

  async logoutThroughDropdown() {
    I.waitForElement({ css: '.g3-icon--user-circle' }, 15);
    I.click('.g3-icon--user-circle');
    portal.clickProp({ locator: { xpath: '//a[contains(text(), \'Logout\')]' } });
    await this.systemUseMsg();
  },
};
