const homeProps = require('./homeProps.js');
const portal = require('../../../utils/portal.js');

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
    I.captureBrowserLog();
    I.saveScreenshot('Home_page_for_debugging.png');
    portal.seeProp(homeProps.ready_cue, 60);
  },

  systemUseMsg() {
    I.amOnPage(homeProps.path);
    I.wait(5);
    I.saveScreenshot('SystemUser_debugging.png');
    I.click(homeProps.systemUseAcceptButton.locator);
  },

  /**
   * Logs into windmill. Uses the "dev_login" cookie to tell fence
   * which username to use when mocking the login.
   * /!\ remember to logout after logging in or following tests will fail!
   */
  login(username) {
    this.goToHomepage();
    I.setCookie({ name: 'dev_login', value: username });
    portal.clickProp(homeProps.googleLoginButton);
  },

  // This should become default once all Commons move to the version of portal
  // with Login button on top bar
  topBarLogin(username) {
    this.goToHomepage();
    I.setCookie({ name: 'dev_login', value: username });
    portal.clickProp(homeProps.loginButton);
    portal.clickProp(homeProps.googleLoginButton);
  },

  /**
   * Logs out of windmill
   */
  logout() {
    portal.clickProp(homeProps.logoutButton);
  },

  logoutThroughDropdown() {
    I.waitForElement({ css: '.g3-icon--user-circle' }, 15);
    I.click('.g3-icon--user-circle');
    portal.clickProp({ locator: { xpath: '//a[contains(text(), \'Logout\')]' } });
  },
};
