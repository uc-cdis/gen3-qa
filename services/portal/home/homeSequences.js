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
    if (!process.env.testedEnv.includes('midrc') || !process.env.testedEnv === 'jenkins-brain') {
      homeQuestions.seeUserLoggedIn(userAcct.username);
    }
  },

  topBarLogin(userAcct = user.mainAcct) {
    homeTasks.topBarLogin(userAcct.username);
    homeQuestions.haveAccessToken();
    if (!process.env.testedEnv.includes('midrc') || !process.env.testedEnv === 'jenkins-brain') {
      homeQuestions.seeUserLoggedIn(userAcct.username);
    }
  },

  logout(userAcct = user.mainAcct) {
    homeTasks.logout();
    if (!process.env.testedEnv.includes('midrc') || !process.env.testedEnv === 'jenkins-brain' ) {
      homeQuestions.isLoggedOut(userAcct.username);
    }
  },
};
