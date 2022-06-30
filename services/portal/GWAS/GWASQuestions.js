/* eslint-disable max-len */
const I = actor();

const GWASTasks = require('./GWASTasks.js');

async function checkElement(element) {
  let refreshed = 0; // keep track of how many refreshes
  while (refreshed < 3) {
    if (refreshed > 0) {
      I.refreshPage();
      await GWASTasks.checkJobStatus();
    }
    let spanShowed = await tryTo(() => I.waitForElement(element, 2)); // eslint-disable-line
    if (!spanShowed) {
      refreshed += 1;
    } else {
      break;
    }
  }
  I.seeElement(element);
}

module.exports = {
  async isJobStart(jobName) {
    const InProgressxpath = `//li[.//dt[contains(normalize-space(),"${jobName}")]]//span[text()="In Progress"]`;
    await checkElement(InProgressxpath);
  },

  async isJobComplete(jobName) {
    const Completexpath = `//li[.//dt[contains(normalize-space(),"${jobName}")]]//span[text()="Completed"]`;
    await checkElement(Completexpath);
  },
};
