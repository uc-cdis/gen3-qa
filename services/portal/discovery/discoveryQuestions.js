const props = require('./discoveryProps.js');
const tasks = require('./discoveryTasks.js');

const I = actor();

module.exports = {
  isCurrentPage() {
    I.waitUrlEquals(props.path);
  },

  isPageLoaded() {
    I.seeElement(props.readyCue, 30);
  },

  isStudyFound(studyId) {
    const retries = 10;
    for(let attempt = 1; attempt <= retries; attempt++){
      try {
        I.seeElement(props.studyLocator(studyId));
        return true;
      } catch (error) {
        console.log(`Attempt ${attempt} to find study ${studyId} failed. Retrying ...`);
        if (attempt < retries) {
          tasks.goToPage();
        } else {
          console.error(`Study ${studyId} not found after maximum retries.`);
          throw error; // Re-throw the error after exhausting all retries
        }
      };
    }
  },
};
