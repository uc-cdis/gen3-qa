/* eslint-disable max-len */
const homeProps = require('./homeProps.js');
const portal = require('../../../utils/portal.js');
const { Bash } = require('../../../utils/bash.js');

const bash = new Bash();
const { exists } = require('codeceptjs');
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
    I.saveScreenshot('SystemUseMessage.png');
    const title = await bash.runCommand('gen3 secrets decode portal-config gitops.json | jq \'.components.systemUse.systemUseTitle\'');
    console.log(`systemUse popup configured: ${title}`);
    if (title !== null && title !== '') {
      console.log(`System Use Message configured: ${title}`);
      // check popup exists
      if(exists(homeProps.getSystemUsePopup(title))) {
        I.click(homeProps.systemUseAcceptButton.locator);
      } else {
        console.log('Expected systemUse popup to be present but not found');
      }
    } else if (process.env.DEBUG === 'true') {
      console.log('systemUse popup not enabled');
    }
  },

  /**
   * Logs into windmill. Uses the "dev_login" cookie to tell fence
   * which username to use when mocking the login.
   * /!\ remember to logout after logging in or following tests will fail!
   */
  async login(username) {
    this.goToHomepage();
    
    // if `systemUse.showOnlyOnLogin` is false, the system use message is _before_ login
    await this.systemUseMsg();

    I.setCookie({ name: 'dev_login', value: username });
    portal.clickProp(homeProps.googleLoginButton);
    
     // if `systemUse.showOnlyOnLogin` is true, the system use message is _after_ login
    await this.systemUseMsg();
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
    // await this.systemUseMsg();
  },
};
