const pelicanQuestions = require('./pelicanQuestions.js');
const pelicanTasks = require('./pelicanTasks.js');

/**
 * pelican sequences
 */
module.exports = {
  // Sequences are for an service to combine multiple tasks and questions
  testExport() {
  	pelicanTasks.goToExplorerPage();
  	pelicanTasks.exportPFB();
  	pelicanQuestions.checkValidPFB();
  }
};
