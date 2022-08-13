/* eslint-disable max-len */
const I = actor();

const GWASTasks = require('./GWASTasks.js');

async function checkElement(element) {
  let refreshed = 0; // keep track of how many refreshes
  while (refreshed < 10) { // 300 seconds
    if (refreshed > 0) {
      I.refreshPage();
      await GWASTasks.checkJobStatus();
    }
    let spanShowed = await tryTo(() => I.waitForElement(element, 2)); // eslint-disable-line
    if (!spanShowed) {
      I.wait(30);
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
    I.waitForElement(InProgressxpath, 5);
  },

  async isJobComplete(jobName) {
    const Completexpath = `//li[.//dt[contains(normalize-space(),"${jobName}")]]//span[text()="Completed"]`;
    await checkElement(Completexpath);
  },
};
