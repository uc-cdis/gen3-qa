/* eslint-disable codeceptjs/no-skipped-tests */
Feature('GWAS UI @requires-portal @requires-argo-wrapper @requires-cohort-middleware');

const { Bash } = require('../../utils/bash.js');

const bash = new Bash();
// const { expect } = require('chai');
const GWASTasks = require('../../services/portal/GWAS/GWASTasks.js');
const GWASProps = require('../../services/portal/GWAS/GWASProps.js');
const GWASQuestions = require('../../services/portal/GWAS/GWASQuestions.js');

Scenario('GWAS submit workflow through case control GWAS @GWASUI', async ({
  I, home, users,
}) => {
  I.useWebDriverTo('set window size', async ({ browser }) => {
    browser.setWindowSize(1920, 1080);
  });
  home.do.goToHomepage();
  await home.complete.login(users.mainAcct);

  GWASTasks.goToGWASPage();

  await GWASTasks.selectCaseControl();
  // TODO: check add a new cohort
  // select 1st cohort
  await GWASTasks.selectCohort();
  await GWASTasks.clickNextButton();
  // select 2nd cohort
  await GWASTasks.selectCohort();
  await GWASTasks.clickNextButton();
  // select variables
  await GWASTasks.selectVariables();
  await GWASTasks.clickNextButton();
  // review
  await GWASTasks.clickNextButton();
  // TODO: Check the covariates are correct
  // TODO: handle error when select hare group
  // select parameters (group)
  await GWASTasks.selectAncestryGroup();
  await GWASTasks.clickNextButton();
  // enter a job name
  const jobName = await GWASTasks.enterJobName();
  await GWASTasks.submitJob();

  I.wait(1);

  await GWASTasks.checkJobStatus();

  await GWASQuestions.isJobStart(jobName);
  I.saveScreenshot('GWAS_page_check_job_status_Start.png');
  I.wait(50);
  await GWASQuestions.isJobComplete(jobName);
  I.saveScreenshot('GWAS_page_check_job_status_Complete.png');
});

xScenario('GWAS submit workflow @GWASUI', async ({
  I, home, users,
}) => {
  home.do.goToHomepage();
  await home.complete.login(users.mainAcct);

  GWASTasks.goToGWASPage();

  await GWASTasks.selectCohort();
  await GWASTasks.clickNextButton();
  await GWASTasks.selectVariables();
  await GWASTasks.clickNextButton();
  await GWASTasks.selectPhenotype();
  await GWASTasks.clickNextButton();
  await GWASTasks.setParameters();
  await GWASTasks.clickNextButton();
  await GWASTasks.submitJob();

  I.wait(1);
  const runId = await getRunId();

  await GWASTasks.CheckJobStatus();

  await GWASQuestions.isJobStart(runId);
  I.saveScreenshot('GWAS_page_check_job_status_Start.png');
  I.wait(50);
  await GWASQuestions.isJobComplete();
  I.saveScreenshot('GWAS_page_check_job_status_Complete.png');
});

// TODO: will change delete to cancel in future
xScenario('GWAS delete workflow while processing job @GWASUI', async ({
  I, home, users,
}) => {
  home.do.goToHomepage();
  await home.complete.login(users.mainAcct);

  GWASTasks.goToGWASPage();

  await GWASTasks.selectCohort();
  await GWASTasks.clickNextButton();
  await GWASTasks.selectVariables();
  await GWASTasks.clickNextButton();
  await GWASTasks.selectPhenotype();
  await GWASTasks.clickNextButton();
  await GWASTasks.setParameters();
  await GWASTasks.clickNextButton();
  await GWASTasks.submitJob();
  await GWASTasks.CheckJobStatus();

  I.wait(1);
  const runId = await getRunId();

  await GWASTasks.CheckJobStatus();

  await GWASQuestions.isJobStart(runId);
  await GWASTasks.DeleteJob();
  I.seeElement(GWASProps.JobCanceling);
  I.wait(2);
  await GWASQuestions.isJobCancel(runId);
  I.saveScreenshot('GWAS_page_check_job_status_Cancel.png');
});

xScenario('GWAS previous button and next button @GWASUI', async ({
  I, home, users,
}) => {
  home.do.goToHomepage();
  await home.complete.login(users.mainAcct);

  GWASTasks.goToGWASPage();

  await GWASTasks.selectCohort();
  await GWASTasks.clickNextButton();
  await GWASTasks.selectVariables();
  await GWASTasks.clickPreviousButton();
  I.seeElement(GWASProps.SelectCohortTitle);
  await GWASTasks.clickNextButton();
  await GWASTasks.clickNextButton();
  I.seeElement(GWASProps.SelectPhenotypeTitle);
});

xScenario('Unauthorize to workflow @GWASUI', async ({
  I, home, users,
}) => {
  home.do.goToHomepage();
  await home.complete.login(users.auxAcct1);

  GWASTasks.goToGWASPage();

  I.dontSeeElement(GWASProps.JobStatusesButton);
  // TODO: add message for unauthorized user
});
