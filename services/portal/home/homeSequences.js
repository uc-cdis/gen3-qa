const { output } = require('codeceptjs');

const homeQuestions = require('./homeQuestions.js');
const homeTasks = require('./homeTasks.js');
const user = require('../../../utils/user.js');

const I = actor();

/**
 * home sequences
 */
module.exports = {
  async login(userAcct = user.mainAcct) {
    const systemUseConfigured = homeQuestions.systemUsePopupConfigured();
    homeTasks.goToHomepage();
    // if `systemUse.showOnlyOnLogin` is false, the system use message is _before_ login
    output.debug('--- Handling systemUse popup before login ---');
    if (systemUseConfigured) {
      await homeTasks.handleSystemUsePopup();
    }
    await homeTasks.login(userAcct.username);
    // if `systemUse.showOnlyOnLogin` is true, the system use message is _after_ login
    output.debug('--- Handling systemUse popup after login ---');
    if (systemUseConfigured) {
      await homeTasks.handleSystemUsePopup();
    }
    homeQuestions.haveAccessToken();
    // Custom flow for envs with useProfileDropdown enabled
    if (process.env.testedEnv.includes('midrc') || process.env.testedEnv.includes('jenkins-brain')) {
      homeQuestions.seeUserLoggedInOnDropdown(userAcct.username);
    } else {
      homeQuestions.seeUserLoggedIn(userAcct.username);
    }
  },

  async logout(userAcct = user.mainAcct) {
    I.saveScreenshot('before_logout.png');
    // Custom flow for envs with useProfileDropdown enabled
    if (process.env.testedEnv.includes('midrc') || process.env.testedEnv.includes('jenkins-brain')) {
      await homeTasks.logoutThroughDropdown();
    } else {
      await homeTasks.logout();
    }
    homeQuestions.isLoggedOut(userAcct.username);
  },
};
