const loginProps = require('./loginProps.js');

const I = actor();

/**
 * login questions
 */
module.exports = {
  haveAccessToken() {
    I.seeCookie('access_token');
  },

  seeUserLoggedIn(username) {
    I.waitForText(username, 15);
  },

  isLoggedOut(username) {
    I.wait(5);
    I.dontSee(username);
  },

  isCurrentPage() {
    I.waitUrlEquals(loginProps.path, 10);
  },
};
