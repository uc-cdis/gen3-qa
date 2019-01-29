const homeQuestions = require('./homeQuestions.js');
const homeTasks = require('./homeTasks.js');
const users = require('../../../utils/user.js');

/**
 * home sequences
 */
module.exports = {
  // Sequences are for an service to combine multiple tasks and questions
  login(userAcct) {
    homeTasks.login(userAcct);
    homeQuestions.haveAccessToken();
    homeQuestions.seeUserLoggedIn(userAcct);
  },
};
