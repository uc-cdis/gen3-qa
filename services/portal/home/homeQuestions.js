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
    portal.seeProp(homeProps.summary, 60, 1);
    // since all the commons do not have cards on the homepage
    // we will ignore the check
    // portal.seeProp(homeProps.cards, 10);
  },

  seeUserLoggedIn(username) {
    I.waitForText(username, 15);
  },

  seeUserLoggedInOnDropdown(username) {
    I.wait(2);
    I.saveScreenshot('waitingForUserCircleIcon.png');
    I.waitForElement({ css: '.g3-icon--user-circle' }, 15);
    I.saveScreenshot('Clicking_on_dropdown_at_top_bar.png');
    I.click('.g3-icon--user-circle');
    I.waitForText(username, 15);
  },

  isLoggedOut(username) {
    I.wait(5);
    I.dontSee(username);
  },
};
