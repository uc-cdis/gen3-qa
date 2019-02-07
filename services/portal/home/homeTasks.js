const homeProps = require('./homeProps.js');
const portal = require('../../../utils/portal.js');
const users = require('../../../utils/user.js');

const I = actor();

/**
 * home Tasks
 */
module.exports = {
  goTo() {
    I.amOnPage(homeProps.path);
    portal.seeProp(homeProps.ready_cue, 10);
  },

  async login(userAcct = users.mainAcct) {
    I.amOnPage('/');
    portal.clickProp(homeProps.googleLoginButton);
  }
};
