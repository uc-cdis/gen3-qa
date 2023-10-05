/* eslint-disable codeceptjs/no-skipped-tests */
Feature('GWAS UI @requires-portal @requires-argo-wrapper @requires-cohort-middleware');

const GWASTasks = require('../../../services/portal/GWAS/GWASTasks.js');
const GWASProps = require('../../../services/portal/GWAS/GWASProps.js');
const GWASQuestions = require('../../../services/portal/GWAS/GWASQuestions.js');

Scenario('GWAS submit workflow through Case Control GWAS', async ({
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
  // Add Custom
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
  I.saveScreenshot('GWAS_page_check_job_status_Start_1.png');
  I.wait(50);
  await GWASQuestions.isJobComplete(jobName);
  I.saveScreenshot('GWAS_page_check_job_status_Complete_1.png');
});

Scenario('GWAS submit workflow through Quantitative Phenotype GWAS', async ({
  I, home, users,
}) => {
  I.useWebDriverTo('set window size', async ({ browser }) => {
    browser.setWindowSize(1920, 1080);
  });
  home.do.goToHomepage();
  await home.complete.login(users.mainAcct);

  GWASTasks.goToGWASPage();

  await GWASTasks.selectQuantitative();
  // TODO: check add a new cohort
  // select 1st cohort
  await GWASTasks.selectCohort();
  await GWASTasks.clickNextButton();
  // select harmonized variables (1st and 2nd)
  await GWASTasks.selectVariables();
  await GWASTasks.clickNextButton();
  // select which variable is your phenotype
  await GWASTasks.selectPhenotypeVariable();
  // Add custom dichotomous covariates
  await GWASTasks.clickNextButton();
  // set parameters
  await GWASTasks.clickNextButton();
  // select parameters (group)
  await GWASTasks.selectAncestryGroup();
  await GWASTasks.clickNextButton();
  // enter a job name
  const jobName = await GWASTasks.enterJobName();
  await GWASTasks.submitJob();

  I.wait(1);

  await GWASTasks.checkJobStatus();

  await GWASQuestions.isJobStart(jobName);
  I.saveScreenshot('GWAS_page_check_job_status_Start_2.png');
  I.wait(50);
  await GWASQuestions.isJobComplete(jobName);
  I.saveScreenshot('GWAS_page_check_job_status_Complete_2.png');
});

Scenario('GWAS previous button and next button', async ({
  I, home, users,
}) => {
  home.do.goToHomepage();
  await home.complete.login(users.mainAcct);

  GWASTasks.goToGWASPage();

  // Case Control
  await GWASTasks.selectCaseControl();
  await GWASTasks.selectCohort();
  await GWASTasks.clickNextButton();
  // select 2nd cohort and go back to 1st step
  await GWASTasks.selectCohort();
  await GWASTasks.clickPreviousButton();
  // the 1st cohort should be selected
  I.seeElement(GWASProps.SelectedRadio);
  // go to the 2nd cohort and it should be selected
  await GWASTasks.clickNextButton();
  I.seeElement(GWASProps.SelectedRadio);
  // go to next step, select variables
  await GWASTasks.clickNextButton();
  await GWASTasks.selectVariables();
  // go back to select cohort step
  await GWASTasks.clickPreviousButton();
  I.seeElement(GWASProps.SelectCohortTitle);
  await GWASTasks.clickNextButton();
  await GWASTasks.clickNextButton();
  I.seeElement(GWASProps.SelectConceptTitle);
});

Scenario('Select different GWAS Type', async ({
  I, home, users,
}) => {
  home.do.goToHomepage();
  await home.complete.login(users.mainAcct);

  GWASTasks.goToGWASPage();

  // Case Control
  await GWASTasks.selectCaseControl();
  await GWASTasks.selectCohort();
  await GWASTasks.clickNextButton();
  await GWASTasks.selectDifferentType();

  // select yes to select different type
  await I.click(GWASProps.AreyousureYes);
  I.seeElement(GWASProps.CaseControlTitle);
  I.dontSeeElement(GWASProps.NextSpan);

  await GWASTasks.selectCaseControl();
  await GWASTasks.selectCohort();
  await GWASTasks.clickNextButton();
  await GWASTasks.selectCohort();
  await GWASTasks.selectDifferentType();
  // select no to select different type
  await I.click(GWASProps.AreyousureNo);
  I.dontSeeElement(GWASProps.CaseControlTitle);
  I.seeElement(GWASProps.SelectCohortTitle);
  I.seeElement(GWASProps.SelectedRadio);
});

Scenario('Unauthorize to workflow', async ({
  I, home, users,
}) => {
  home.do.goToHomepage();
  await home.complete.login(users.auxAcct1);

  GWASTasks.goToGWASPage();

  I.dontSeeElement(GWASProps.JobStatusesButton);
  // TODO: add message for unauthorized user
});

// selete different GWAS TYPE
