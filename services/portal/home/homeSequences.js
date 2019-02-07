const homeQuestions = require('./homeQuestions.js');
const homeTasks = require('./homeTasks.js');
const user = require('../../../utils/user.js');

/**
 * home sequences
 */
module.exports = {
  // Sequences are for an service to combine multiple tasks and questions
  login(userAcct = user.mainAcct) {
    homeTasks.login(userAcct);
    homeQuestions.haveAccessToken();
    homeQuestions.seeUserLoggedIn(userAcct);
  },
};
