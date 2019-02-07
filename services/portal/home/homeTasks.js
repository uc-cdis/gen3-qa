const homeProps = require('./homeProps.js');
const portal = require('../../../utils/portal.js');

const I = actor();

/**
 * home Tasks
 */
module.exports = {
  goTo() {
    I.amOnPage(homeProps.path);
    portal.seeProp(homeProps.ready_cue, 10);
  },

  /**
   * Logs into windmill. Uses the "dev_login" cookie to tell fence
   * which username to use when mocking the login.
   */
  async login(userAcct) {
    I.amOnPage('/');
    I.setCookie({ name: 'dev_login', value: userAcct.username });
    portal.clickProp(homeProps.googleLoginButton);
  }
};
