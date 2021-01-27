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

  seeUserLoggedInOnDropdown(username) {
    I.waitForElement({ css: '.g3-icon--user-circle' }, 15);
    I.saveScreenshot('Clicking_on_dropdown_at_top_bar.png');
    I.click('.g3-icon--user-circle');
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
