Feature('GWAS UI @requires-portal @requires-argo-wrapper @requires-cohort-middleware');

const { expect } = require('chai');
const { Bash } = require('../../utils/bash.js');
const GWASTasks = require('../../services/portal/GWAS/GWASTasks.js');
const GWASProps = require('../../services/portal/GWAS/GWASProps.js');
const GWASQuestions = require('../../services/portal/GWAS/GWASQuestions.js');

const bash = new Bash();

async function getExistingJobNumbers(I) {
  await GWASTasks.CheckJobStatus();
  let numOfElements = await I.grabNumberOfVisibleElements(GWASProps.JobIDs);
  I.click(GWASProps.JobStatusesButton);
  return numOfElements;
}

async function getExistingSuccessfulJobNumbers(I) {
  await GWASTasks.CheckJobStatus();
  let numOfElements = await I.grabNumberOfVisibleElements(GWASProps.JobComplete);
  I.click(GWASProps.JobStatusesButton);
  return numOfElements;
}

Scenario('GWAS submit workflow', async ({
  I, home, users, login,
}) => {
  home.do.goToHomepage();
  login.complete.login(users.mainAcct);
  
  GWASTasks.goToGWASPage();
  let jobNumber = getExistingJobNumbers(I);
  let successfulJobNumber = getExistingSuccessfulJobNumbers(I);

  await GWASTasks.selectCohort();
  await GWASTasks.ClickNextButton();
  await GWASTasks.SelectVariables();
  await GWASTasks.ClickNextButton();
  await GWASTasks.selectPhenotype();
  await GWASTasks.ClickNextButton();
  await GWASTasks.setParameters();
  await GWASTasks.ClickNextButton();
  await GWASTasks.SubmitJob();
  await GWASTasks.ClickNextButton();
  await GWASTasks.CheckJobStatus();
  
  await GWASQuestions.isJobStart(jobNumber);
  I.saveScreenshot('GWAS_page_check_job_status_waitForStart.png');
  I.wait(5);
  await GWASQuestions.isJobComplete(successfulJobNumber);
  I.saveScreenshot('GWAS_page_check_job_status_waitForComplete.png');
});

Scenario('GWAS delete workflow after completing job', async ({
  I, home, users, login,
}) => {
  home.do.goToHomepage();
  login.complete.login(users.mainAcct);
  GWASTasks.goToGWASPage();
  let jobNumber = getExistingJobNumbers(I);
  expect(jobNumber).to.be.at.least(1);

  await GWASTasks.DeleteJob();
  I.wait(2);
  await GWASQuestions.isJobDelete();
  I.saveScreenshot('GWAS_page_check_job_status_afterDelete.png');
});

Scenario('GWAS delete workflow while processing job', async ({
  I, home, users, login,
}) => {
  home.do.goToHomepage();
  login.complete.login(users.mainAcct);
  
  GWASTasks.goToGWASPage();

  await GWASTasks.selectCohort();
  await GWASTasks.ClickNextButton();
  await GWASTasks.SelectVariables();
  await GWASTasks.ClickNextButton();
  await GWASTasks.selectPhenotype();
  await GWASTasks.ClickNextButton();
  await GWASTasks.setParameters();
  await GWASTasks.ClickNextButton();
  await GWASTasks.SubmitJob();
  await GWASTasks.ClickNextButton();
  await GWASTasks.CheckJobStatus();
  
  await GWASQuestions.isJobStart(jobNumber);
  I.seeElement(GWASProps.JobProcessing);
  await GWASTasks.DeleteJob();
  I.seeElement(GWASProps.JobCanceling);
  I.saveScreenshot('GWAS_page_check_job_status_Canceling.png');
});

Scenario('GWAS previous button', async ({
  I, home, users, login,
}) => {
  home.do.goToHomepage();
  login.complete.login(users.mainAcct);
  
  GWASTasks.goToGWASPage();

  await GWASTasks.selectCohort();
  await GWASTasks.ClickNextButton();
  await GWASTasks.SelectVariables();
  await GWASTasks.ClickPreviousButton();
  I.seeElement(GWASProps.SelectCohortTitle);
  await GWASTasks.ClickNextButton();
  await GWASTasks.ClickNextButton();
  I.seeElement(GWASProps.SelectPhenotypeTitle);
});

