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
    // Skip this test flow for envs with useProfileDropdown enabled
    if (process.env.testedEnv.includes('midrc') || process.env.testedEnv === 'jenkins-brain.planx-pla.net') {
      homeQuestions.seeUserLoggedInOnDropdown(userAcct.username);
    } else {
      homeQuestions.seeUserLoggedIn(userAcct.username);
    }
  },

  topBarLogin(userAcct = user.mainAcct) {
    homeTasks.topBarLogin(userAcct.username);
    homeQuestions.haveAccessToken();
    // Skip this test flow for envs with useProfileDropdown enabled
    if (process.env.testedEnv.includes('midrc') || process.env.testedEnv === 'jenkins-brain.planx-pla.net') {
      homeQuestions.seeUserLoggedInOnDropdown(userAcct.username);
    } else {
      homeQuestions.seeUserLoggedIn(userAcct.username);
    }
  },

  logout(userAcct = user.mainAcct) {
    // Skip this test flow for envs with useProfileDropdown enabled
    if (process.env.testedEnv.includes('midrc') || process.env.testedEnv === 'jenkins-brain') {
      homeTasks.logoutThroughDropdown();
    } else {
      homeTasks.logout();
    }
  },
};
