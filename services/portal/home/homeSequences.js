const homeQuestions = require('./homeQuestions.js');
const homeTasks = require('./homeTasks.js');
const user = require('../../../utils/user.js');

const I = actor();

/**
 * home sequences
 */
module.exports = {
  login(userAcct = user.mainAcct) {
    homeTasks.login(userAcct.username);
    homeQuestions.haveAccessToken();
    homeQuestions.seeUserLoggedIn(userAcct.username);
  },

  logout(userAcct = user.mainAcct) {
    homeTasks.logout();
    homeQuestions.isLoggedOut(userAcct.username);
  },
};
