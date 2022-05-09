/* eslint-disable codeceptjs/no-skipped-tests */
Feature('GWAS UI @requires-portal @requires-argo-wrapper @requires-cohort-middleware');

const { Bash } = require('../../utils/bash.js');

const bash = new Bash();
// const { expect } = require('chai');
const GWASTasks = require('../../services/portal/GWAS/GWASTasks.js');
const GWASProps = require('../../services/portal/GWAS/GWASProps.js');
const GWASQuestions = require('../../services/portal/GWAS/GWASQuestions.js');

async function getRunId() {
  const res = await bash.runCommand('argo -n argo list | sed -n \'2 p\'');
  console.log(res);
  // argo-wrapper-workflow-xxxx   Succeeded             1m    40s        0
  const runId = res.split(' ')[0];
  return runId;
}

Scenario('GWAS submit workflow', async ({
  I, home, users,
}) => {
  home.do.goToHomepage();
  await home.complete.login(users.mainAcct);

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
xScenario('GWAS delete workflow while processing job', async ({
  I, home, users,
}) => {
  home.do.goToHomepage();
  await home.complete.login(users.mainAcct);

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

Scenario('GWAS previous button and next button', async ({
  I, home, users,
}) => {
  home.do.goToHomepage();
  await home.complete.login(users.mainAcct);

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

Scenario('Unauthorize to workflow', async ({
  I, home, users,
}) => {
  home.do.goToHomepage();
  await home.complete.login(users.mainAcct);

  GWASTasks.goToGWASPage();

  I.dontSeeElement(GWASProps.JobStatusesButton);
  // TODO: add message for unauthorized user
});
