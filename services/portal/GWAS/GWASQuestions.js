/* eslint-disable max-len */
const chai = require('chai');

const { expect } = chai;
const I = actor();

const GWASTasks = require('./GWASTasks.js');
const GWASProps = require('./GWASProps.js');

module.exports = {
  async isJobStart(jobId) {
    let refreshed = 0; // keep track of how many refreshes
    let InProgressxpath = `//li[.//h4[contains(text(),"${jobId}")]]//span[text()="In Progress"]`;
    while (refreshed < 3) {
      if (refreshed > 0) {
        I.refreshPage();
        await GWASTasks.CheckJobStatus();
      }
      let InProgressSpan = await tryTo(() => I.waitForElement(InProgressxpath, 2)); // eslint-disable-line
      if (!InProgressSpan) {
        refreshed += 1;
      } else {
        break;
      }
    }
    I.seeElement(InProgressxpath);
  },

  async isJobComplete(jobId) {
    let refreshed = 0; // keep track of how many refreshes
    let Completexpath = `//li[.//h4[contains(text(),"${jobId}")]]//span[text()="Completed"]`;
    while (refreshed < 3) {
      if (refreshed > 0) {
        I.refreshPage();
        await GWASTasks.CheckJobStatus();
      }
      let completeSpan = await tryTo(() => I.waitForElement(Completexpath, 2)); // eslint-disable-line
      if (!completeSpan) {
        refreshed += 1;
      } else {
        break;
      }
    }
    I.seeElement(GWASProps.Completexpath);
  },

  async isJobCancel() {
    let refreshed = 0; // keep track of how many refreshes
    let Cancelxpath = `//li[.//h4[contains(text(),"${jobId}")]]//span[text()="Cancelled"]`;
    while (refreshed < 3) {
      if (refreshed > 0) {
        I.refreshPage();
        await GWASTasks.CheckJobStatus();
      }
      let completeSpan = await tryTo(() => I.waitForElement(Cancelxpath, 2)); // eslint-disable-line
      if (!completeSpan) {
        refreshed += 1;
      } else {
        break;
      }
    }
    I.seeElement(GWASProps.Cancelxpath);
  },
};
