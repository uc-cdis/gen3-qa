loginProps = require('./loginProps.js')

const I = actor();

/**
 * login questions
 */
module.exports = {
  haveAccessToken() {
    I.seeCookie('access_token');
  },

  seeUserLoggedIn(username) {
    I.waitForText(username, 5);
  },

  isLoggedOut(username) {
    I.wait(5);
    I.dontSee(username);
  },

  isPageLoaded() {
    I.waitForElement(loginProps.ready_cue.locator, 10);
  }
};
