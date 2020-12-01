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
    // Custom flow for envs with useProfileDropdown enabled
    if (process.env.testedEnv.includes('midrc') || process.env.testedEnv.includes('jenkins-brain')) {
      loginQuestions.seeUserLoggedInOnDropdown(userAcct.username);
    } else {
      loginQuestions.seeUserLoggedIn(userAcct.username);
    }
  },

  topBarLogin(userAcct = user.mainAcct) {
    loginTasks.topBarLogin(userAcct.username);
    loginQuestions.haveAccessToken();
    // Custom flow for envs with useProfileDropdown enabled
    if (process.env.testedEnv.includes('midrc') || process.env.testedEnv.includes('jenkins-brain')) {
      loginQuestions.seeUserLoggedInOnDropdown(userAcct.username);
    } else {
      loginQuestions.seeUserLoggedIn(userAcct.username);
    }
  },

  logout(userAcct = user.mainAcct) {
    // Custom flow for envs with useProfileDropdown enabled
    if (process.env.testedEnv.includes('midrc') || process.env.testedEnv.includes('jenkins-brain')) {
      loginTasks.logoutThroughDropdown();
    } else {
      loginTasks.logout();
    }
    loginQuestions.isLoggedOut(userAcct.username);
  },
};
