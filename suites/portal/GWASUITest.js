/* eslint-disable codeceptjs/no-skipped-tests */
Feature('GWAS UI @requires-portal @requires-argo-wrapper @requires-cohort-middleware');

const GWASTasks = require('../../services/portal/GWAS/GWASTasks.js');
const GWASProps = require('../../services/portal/GWAS/GWASProps.js');
const GWASQuestions = require('../../services/portal/GWAS/GWASQuestions.js');

Scenario('GWAS submit workflow through Case Control GWAS @GWASUI', async ({
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
  // Navigate to the result tab
  await GWASTasks.navigateToJobStatus();
  await GWASTasks.checkJobStatus();

  await GWASQuestions.isJobStart(jobName);
  I.saveScreenshot('GWAS_page_check_job_status_Start_1.png');
  I.wait(50);
  await GWASQuestions.isJobComplete(jobName);
  I.saveScreenshot('GWAS_page_check_job_status_Complete_1.png');
});

Scenario('GWAS submit workflow through Quantitative Phenotype GWAS @GWASUI', async ({
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
  await GWASTasks.navigateToJobStatus();
  await GWASTasks.checkJobStatus();

  await GWASQuestions.isJobStart(jobName);
  I.saveScreenshot('GWAS_page_check_job_status_Start_2.png');
  I.wait(50);
  await GWASQuestions.isJobComplete(jobName);
  I.saveScreenshot('GWAS_page_check_job_status_Complete_2.png');
});

Scenario('GWAS previous button and next button @GWASUI', async ({
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
  I.seeElement(GWASProps.SelectConceptTitle);
});

Scenario('Select different GWAS Type @GWASUI', async ({
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

Scenario('Unauthorize to workflow @GWASUI', async ({
  I, home, users,
}) => {
  home.do.goToHomepage();
  await home.complete.login(users.auxAcct1);

  GWASTasks.goToGWASPage();

  I.dontSeeElement(GWASProps.JobStatusesButton);
  // TODO: add message for unauthorized user
});

// selete different GWAS TYPE
Scenario('GWAS test out table filtering @GWASUI', async ({
  I, home, users,
}) => {
  home.do.goToHomepage();
  await home.complete.login(users.mainAcct);

  GWASTasks.goToGWASPage();

  // Case Control
  await GWASTasks.selectCaseControl();
  await GWASTasks.CheckCohortSearch();
  await GWASTasks.selectCohort();
  await GWASTasks.clickNextButton();
  // select 2nd cohort and go back to 1st step
  await GWASTasks.CheckCohortSearch();
  await GWASTasks.selectCohort();
  await GWASTasks.clickPreviousButton();
  // the 1st cohort should be selected
  I.seeElement(GWASProps.SelectedRadio);
  // go to the 2nd cohort and it should be selected
  await GWASTasks.clickNextButton();
  I.seeElement(GWASProps.SelectedRadio);
  // go to next step, search and select variables
  await GWASTasks.clickNextButton();
  await GWASTasks.CheckConceptSearch();
  await GWASTasks.selectVariables();
  // go back to select cohort step
  await GWASTasks.clickPreviousButton();
  I.seeElement(GWASProps.SelectCohortTitle);
  // go to select next step, do cohort search
  await GWASTasks.clickNextButton();
  await GWASTasks.clickNextButton();
  await GWASTasks.clickNextButton();
  await GWASTasks.CheckCohortSearchOnCustomDich1();
  await GWASTasks.CheckCohortSearchOnCustomDich2();
});

Scenario('Attrition Table in Case Control GWAS @GWASUI', async ({
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
  await GWASTasks.CheckCaseControlCohortAttritiontbl();
  await GWASTasks.clickNextButton();
  // select 2nd cohort
  await GWASTasks.selectCohort();
  await GWASTasks.CheckCaseControlCohortAttritiontbl();
  await GWASTasks.clickNextButton();
  // select variables
  await GWASTasks.selectVariables();
  await GWASTasks.CheckCaseControlCohortAttritiontbl();
  await GWASTasks.clickNextButton();
  // review
  await GWASTasks.CheckCaseControlCohortAttritiontbl();
  await GWASTasks.clickNextButton();
  // Add Custom
  await GWASTasks.CheckCaseControlCohortAttritiontbl();
  await GWASTasks.clickNextButton();
  // check att table
  await GWASTasks.CheckCaseControlCohortAttritiontbl();
  I.saveScreenshot('GWAS_CaseControlAttrition_tbl.png');
});

Scenario('Attrition Table in Quantitative Phenotype GWAS @GWASUI', async ({
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
  await GWASTasks.CheckCohortAttritiontbl();
  await GWASTasks.clickNextButton();
  // select harmonized variables (1st and 2nd)
  await GWASTasks.selectVariables();
  await GWASTasks.CheckCohortAttritiontbl();
  await GWASTasks.clickNextButton();
  // select which variable is your phenotype
  await GWASTasks.selectPhenotypeVariable();
  await GWASTasks.CheckCohortAttritiontbl();
  // Add custom dichotomous covariates
  await GWASTasks.clickNextButton();
  await GWASTasks.CheckCohortAttritiontbl();
  // set parameters
  await GWASTasks.clickNextButton();
  await GWASTasks.CheckCohortAttritiontbl();
  // check att table
  await GWASTasks.CheckCohortAttritiontbl();
  I.saveScreenshot('GWAS_CohortAttrition_tbl.png');
});
