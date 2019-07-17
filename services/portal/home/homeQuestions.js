const homeProps = require('./homeProps.js');
const portal = require('../../../utils/portal.js');

const I = actor();

/**
 * home Questions
 */
module.exports = {
  async haveAccessToken() {
    I.seeCookie('access_token');
  },

  seeDetails() {
    portal.seeProp(homeProps.summary, 10, 1);
    portal.seeProp(homeProps.cards, 10);
  },

  seeUserLoggedIn(username) {
    I.waitForText(username, 5);
  },

  isLoggedOut() {
    portal.seeProp(homeProps.googleLoginButton, 10);
  },
};
