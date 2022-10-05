const GWASProps = require('./GWASProps.js');

const I = actor();

module.exports = {

  goToGWASPage() {
    I.amOnPage(GWASProps.path); // /analysis/vaGWAS
    I.wait(2);
    I.saveScreenshot('GWAS_page.png');
  },

  async selectCaseControl() {
    I.seeElement(GWASProps.CaseControlTitle);
    I.click(GWASProps.CaseControlInput);
  },

  async selectQuantitative() {
    I.seeElement(GWASProps.QuantitativeTitle);
    I.click(GWASProps.QuantitativeInput);
  },

  async selectCohort() {
    I.seeElement(GWASProps.SelectCohortTitle);
    I.click(GWASProps.SelectFirstRadioInput);
  },

  async selectVariables() {
    // TODO: select multiple variables
    I.seeElement(GWASProps.SelectConceptTitle);
    I.click(GWASProps.SelectFirstCheckboxInput);
    I.click(GWASProps.SelectSecondCheckboxInput);
  },

  async selectPhenotypeVariable() {
    I.seeElement(GWASProps.SelectVariableTitle);
    I.click(GWASProps.SelectFirstRadioInput);
  },

  async selectAncestryGroup() {
    I.click(GWASProps.SelectGroupsButton);
    I.click(GWASProps.SelectGrupsDropdown);
  },

  async enterJobName() {
    const jobName = `AutomationTest${Date.now()}`;
    console.log(`the job name is ${jobName}`);
    I.fillField(GWASProps.EnterJobName, jobName);
    return jobName;
  },

  async selectPhenotype() {
    I.seeElement(GWASProps.SelectPhenotypeTitle);
    I.click(GWASProps.SelectFirstRadioInput);
  },

  async setParameters() {
    I.seeElement(GWASProps.SetParameterDiv);
    // TODO: add test parameters
  },

  async clickNextButton() {
    I.seeElement(GWASProps.NextSpan);
    I.click(GWASProps.NextSpan);
  },

  async clickPreviousButton() {
    I.seeElement(GWASProps.PreviousSpan);
    I.click(GWASProps.PreviousSpan);
  },

  async submitJob() {
    I.seeElement(GWASProps.SubmitButton);
    I.click(GWASProps.SubmitButton);
  },

  async selectDifferentType() {
    I.seeElement(GWASProps.SelectDifferentType);
    I.click(GWASProps.SelectDifferentType);
    I.wait(2);
    I.seeElement(GWASProps.AreyousurePopup);
  },

  async navigateToJobStatus() {
    I.click(GWASProps.AppsNavigationTab);
    I.click(GWASProps.GWASResultTitle);
    I.seeElement(GWASProps.JobStatusesButton);
  },

  async checkJobStatus() {
    I.seeElement(GWASProps.JobStatusesButton);
    I.click(GWASProps.JobStatusesButton);
  },

  async CheckCohortSearch() {
    I.seeElement(GWASProps.CohortSearchBar);
    I.wait(5);
    I.fillField(GWASProps.CohortSearchBar, 'medium');
    // TODO : const noOfElements = I.grabNumberOfVisibleElements(GWASProps.CohortSearchResult);
    // TODO : I.assertGreaterOrEquals(2, noOfElements);
  },
  async CheckConceptSearch() {
    I.seeElement(GWASProps.ConceptSearchBar);
    I.wait(5);
    I.fillField(GWASProps.ConceptSearchBar, 'Attribute1');
    // TODO : const noOfElements = I.grabNumberOfVisibleElements(GWASProps.ConceptSearchResult);
    // TODO : I.assertGreaterOrEquals(1, noOfElements);
  },

  async CheckCohortSearchOnCustomDich1() {
    I.seeElement(GWASProps.CohortSearchBar1);
    I.fillField(GWASProps.CohortSearchBar1, 'large');
    I.click(GWASProps.SelectFirstRadioInput);
    // TODO : const noOfElements = I.grabNumberOfVisibleElements(GWASProps.CohortSearchResult1);
    // TODO : I.assertGreaterThanOrEqual(2, noOfElements);
  },

  async CheckCohortSearchOnCustomDich2() {
    I.seeElement(GWASProps.CohortSearchBar2);
    I.fillField(GWASProps.CohortSearchBar2, 'medium');
    I.click(GWASProps.SelectSecondRadioInput);
    I.saveScreenshot('GWAS_page_CohhortSearchPage.png');
    // TODO : const noOfElements = I.grabNumberOfVisibleElements(GWASProps.CohortSearchResult2);
    // TODO : I.assertGreaterThanOrEqual(2, noOfElements);
  },

  async EnterCohortsjob_delete() {
    const jobName = `CohortsName${Date.now()}`;
    console.log(`the Cohorts name is ${jobName}`);
    I.fillField(GWASProps.EnterNameofCustom, jobName);
    I.click(GWASProps.AddButton);
    I.saveScreenshot('GWAS_page_jobstatus.png');
    I.seeElement(GWASProps.CohortDelete);
    I.click(GWASProps.CohortDelete);
    I.saveScreenshot('GWAS_page_jobstatusdelete.png');
    return jobName;
  },

  async CheckCaseControlCohortAttritiontbl() {
    // click on multiple Attritiontbl
    I.seeElement(GWASProps.CaseCohortAttritiontbltxt);
    I.click(GWASProps.AttritiontblBtn);
    I.seeElement(GWASProps.ControlCohortAttritiontbltxt);
    I.click(GWASProps.AttritiontblBtn2);
  },

  async CheckCohortAttritiontbl() {
    // click on Attritiontbl
    I.seeElement(GWASProps.CohortAttritiontbltxt);
    I.click(GWASProps.AttritiontblBtn);
  },

};
