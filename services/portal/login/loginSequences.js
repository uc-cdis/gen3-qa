const loginQuestions = require('./loginQuestions.js');
const loginTasks = require('./loginTasks.js');
const user = require('../../../utils/user.js');

// const I = actor();

/**
 * login sequences
 */
module.exports = {
  login(userAcct = user.mainAcct) {
    loginTasks.login(userAcct.username);
    loginQuestions.haveAccessToken();
    loginQuestions.seeUserLoggedIn(userAcct.username);
  },

  topBarLogin(userAcct = user.mainAcct) {
    loginTasks.topBarLogin(userAcct.username);
    loginQuestions.haveAccessToken();
    loginQuestions.seeUserLoggedIn(userAcct.username);
  },

  logout(userAcct = user.mainAcct) {
    loginTasks.logout();
    loginQuestions.isLoggedOut(userAcct.username);
  },
};
