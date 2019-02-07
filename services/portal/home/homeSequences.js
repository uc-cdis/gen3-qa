const homeQuestions = require('./homeQuestions.js');
const homeTasks = require('./homeTasks.js');
const user = require('../../../utils/user.js');

/**
 * home sequences
 */
module.exports = {
  async login(userAcct = user.mainAcct) {
    await homeTasks.login(userAcct);
    homeQuestions.haveAccessToken();
    homeQuestions.seeUserLoggedIn(userAcct);
  },
};
