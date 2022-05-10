/* eslint-disable max-len */
const I = actor();

const GWASTasks = require('./GWASTasks.js');

async function checkElement(element) {
  let refreshed = 0; // keep track of how many refreshes
  while (refreshed < 3) {
    if (refreshed > 0) {
      I.refreshPage();
      await GWASTasks.CheckJobStatus();
    }
    let InProgressSpan = await tryTo(() => I.waitForElement(element, 2)); // eslint-disable-line
    if (!InProgressSpan) {
      refreshed += 1;
    } else {
      break;
    }
  }
  I.seeElement(element);
}

module.exports = {
  async isJobStart(jobId) {
    const InProgressxpath = `//li[.//h4[contains(text(),"${jobId}")]]//span[text()="In Progress"]`;
    await checkElement(InProgressxpath);
  },

  async isJobComplete(jobId) {
    const Completexpath = `//li[.//h4[contains(text(),"${jobId}")]]//span[text()="Completed"]`;
    await checkElement(Completexpath);
  },

  async isJobCancel(jobId) {
    const Cancelxpath = `//li[.//h4[contains(text(),"${jobId}")]]//span[text()="Cancelled"]`;
    await checkElement(Cancelxpath);
  },
};
