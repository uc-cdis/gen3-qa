/* eslint-disable max-len */
const { output } = require('codeceptjs');

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

  async handleSystemUsePopup() {
    I.saveScreenshot('SystemUsePopup.png');
    const acceptButtonExists = await tryTo(() => I.waitForElement(homeProps.systemUseAcceptButton, 5));
    output.debug(`Accept button found: ${acceptButtonExists}`);
    if (acceptButtonExists) {
      output.debug('Handling popup');
      I.scrollIntoView(homeProps.systemUseAcceptButton);
      I.click(homeProps.systemUseAcceptButton);
    } else {
      output.print('systemUse popup was not found');
    }
    I.saveScreenshot('SystemUsePopupHandled.png');
  },

  /**
   * Logs into windmill. Uses the "dev_login" cookie to tell fence
   * which username to use when mocking the login.
   * /!\ remember to logout after logging in or following tests will fail!
   */
  async login(username) {
    I.setCookie({ name: 'dev_login', value: username });
    portal.clickProp(homeProps.loginButton);
  },

  /**
   * Logs out of windmill
   */
  async logout() {
    portal.clickProp(homeProps.logoutButton);
  },

  async logoutThroughDropdown() {
    I.waitForElement({ css: '.g3-icon--user-circle' }, 15);
    I.click('.g3-icon--user-circle');
    portal.clickProp({ locator: { xpath: '//a[contains(text(), \'Logout\')]' } });
  },
};
