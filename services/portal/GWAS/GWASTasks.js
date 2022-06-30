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
    I.seeElement(GWASProps.QuantitativeInput);
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

  async selectAncestryGroup() {
    I.click(GWASProps.SelectGroupsButton);
    I.click(GWASProps.SelectGrupsDropdown);
  },

  async enterJobName() {
    const jobName = `AutomationTest${Date.now()}`;
    console.log (`the job name is ${jobName}`);
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

  async deleteJob() {
    I.seeElement(GWASProps.JobDeleteButton);
    I.click(GWASProps.JobDeleteButton);
    I.seeElement(GWASProps.JobDeletePopup);
    I.click(GWASProps.JobDeleteYes);
  },

  async checkJobStatus() {
    I.seeElement(GWASProps.JobStatusesButton);
    I.click(GWASProps.JobStatusesButton);
  },
};
