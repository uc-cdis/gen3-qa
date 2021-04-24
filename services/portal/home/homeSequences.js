const homeQuestions = require('./homeQuestions.js');
const homeTasks = require('./homeTasks.js');
const user = require('../../../utils/user.js');

/**
 * home sequences
 */
module.exports = {
  login(userAcct = user.mainAcct) {
    homeTasks.login(userAcct.username);
    homeQuestions.haveAccessToken();
    // Custom flow for envs with useProfileDropdown enabled
    if (process.env.testedEnv.includes('midrc') || process.env.testedEnv.includes('jenkins-brain')) {
      homeQuestions.seeUserLoggedInOnDropdown(userAcct.username);
    } else {
      homeQuestions.seeUserLoggedIn(userAcct.username);
    }
  },

  topBarLogin(userAcct = user.mainAcct) {
    homeTasks.topBarLogin(userAcct.username);
    homeQuestions.haveAccessToken();
    // Custom flow for envs with useProfileDropdown enabled
    if (process.env.testedEnv.includes('midrc') || process.env.testedEnv.includes('jenkins-brain')) {
      homeQuestions.seeUserLoggedInOnDropdown(userAcct.username);
    } else {
      homeQuestions.seeUserLoggedIn(userAcct.username);
    }
  },

  logout(userAcct = user.mainAcct) {
    // Custom flow for envs with useProfileDropdown enabled
    if (process.env.testedEnv.includes('midrc') || process.env.testedEnv.includes('jenkins-brain')) {
      homeTasks.logoutThroughDropdown();
    } else {
      homeTasks.logout();
    }
    homeQuestions.isLoggedOut(userAcct.username);
  },
};
