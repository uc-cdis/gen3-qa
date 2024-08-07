const tasks = require('./gen3ffLandingPageTasks');
const questions = require('./gen3ffLandingPageQuestions');
const props = require('./gen3ffLandingPageProps');

/**
 * Gen3FF Landing Page Service
 */
module.exports = {
  props,
  do: tasks,
  ask: questions,
};
