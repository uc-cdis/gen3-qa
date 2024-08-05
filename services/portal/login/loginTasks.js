const loginProps = require('./loginProps.js');
const portal = require('../../../utils/portal.js');

const I = actor();

/**
 * login tasks
 */
module.exports = {
  goToLoginPage() {
    I.amOnPage(loginProps.path);
    portal.seeProp(loginProps.ready_cue, 60);
  },

  /**
   * Logs into windmill. Uses the "dev_login" cookie to tell fence
   * which username to use when mocking the login.
   * /!\ remember to logout after logging in or following tests will fail!
   */
  login(username) {
    if (I.seeCurrentUrlEquals(loginProps.path)) {
      console.log('Already on Login Page');
    } else {
      this.goToLoginPage();
    }
    I.setCookie({ name: 'dev_login', value: username });
    portal.clickProp(loginProps.googleLoginButton);
  },

  // This should become default once all Commons move to the version of portal
  // with Login button on top bar
  topBarLogin(username) {
    this.goToLoginpage();
    I.setCookie({ name: 'dev_login', value: username });
    portal.clickProp(loginProps.loginButton);
    portal.clickProp(loginProps.googleLoginButton);
  },

  /**
   * Logs out of windmill
   */
  logout() {
    portal.clickProp(loginProps.logoutButton);
    console.log('logged out');
  },

  logoutThroughDropdown() {
    I.waitForElement({ css: '.g3-icon--user-circle' }, 15);
    I.click('.g3-icon--user-circle');
    portal.clickProp({ locator: { xpath: '//a[contains(text(), \'Logout\')]' } });
  },
};
