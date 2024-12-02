const { sleepMS } = require('../../../utils/apiUtil.js');
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

  async isStudyFound(studyId) {
    const retries = 10; // Number of retries
    const delayInMs = 30000; // Delay between retries in milliseconds

    for (let attempt = 1; attempt <= retries; attempt++) {
      const visibleElements = await I.grabNumberOfVisibleElements(props.studyLocator(studyId));

      if (visibleElements > 0) {
        console.log(`Study found on attempt ${attempt}`);
        return true; // Exit the loop if the element is found
      } else {
        console.log(`Attempt ${attempt} failed. Retrying in ${delayInMs / 1000} seconds...`);
        if (attempt < retries) {
          await sleepMS(delayInMs); // Wait before retrying
          tasks.goToPage(); // Refresh discovery page
        } else {
          console.error('Study not found after maximum retries.');
          throw new Error('Study not found.');
        }
      }
    }
  },
};
