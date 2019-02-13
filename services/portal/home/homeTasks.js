const homeProps = require('./homeProps.js');
const portal = require('../../../utils/portal.js');

const I = actor();

/**
 * home Tasks
 */
module.exports = {
  goToHomepage() {
    I.amOnPage(homeProps.path);
    portal.seeProp(homeProps.ready_cue, 10);
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

  /**
   * Logs out of windmill
   */
  logout() {
    portal.clickProp(homeProps.logoutButton);
  },
};
