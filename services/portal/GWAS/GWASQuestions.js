const chai = require('chai');

const { expect } = chai;
const I = actor();

const GWASTasks = require('./GWASTasks.js');
const GWASProps = require('./GWASProps.js');

module.exports = {
  async isJobStart(jobNumber) {
    let refreshed = 0; // keep track of how many refreshes
    while (refreshed < 3) {
      if (refreshed > 0){
        I.refreshPage();
        await GWASTasks.CheckJobStatus();
      }
      let jobNumberAfterSubmit = await I.grabNumberOfVisibleElements(GWASProps.JobIDs);
      if (jobNumberAfterSubmit <= jobNumber) {
        refreshed = refreshed + 1;
      }
      else{
        break
      }
    }
    I.seeElement(GWASProps.JobStarted);
  },
  
  async isJobComplete(successfulJobNumber) {
    let refreshed = 0; // keep track of how many refreshes
    while (refreshed < 3) {
      if (refreshed > 0){
        I.refreshPage();
        await GWASTasks.CheckJobStatus();
      }
      let successfulJobNumberAfterSubmit = await I.grabNumberOfVisibleElements(GWASProps.JobComplete);
      if (successfulJobNumberAfterSubmit <= successfulJobNumber) {
        refreshed = refreshed + 1;
      }
      else{
        break
      }
    }
    I.seeElement(GWASProps.JobComplete);
    I.seeElement(GWASProps.JobFinished);
  },

  async isJobDelete(jobNumber) {
    let refreshed = 0; // keep track of how many refreshes
    let jobNumberAfterDelete = -1;
    while (refreshed < 3) {
      if (refreshed > 0){
        I.refreshPage();
        await GWASTasks.CheckJobStatus();
      }
      jobNumberAfterDelete = await I.grabNumberOfVisibleElements(GWASProps.JobIDs);
      if (jobNumberAfterDelete >= jobNumber) {
        refreshed = refreshed + 1;
      }
      else{
        break
      }
    }
    expect(jobNumberAfterDelete).to.equal(jobNumber - 1);
  },
};
