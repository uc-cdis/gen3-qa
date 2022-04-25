const GWASProps = require('./GWASProps.js');

const I = actor();

module.exports = {

  goToGWASPage() {
    I.amOnPage(GWASProps.path); // /analysis/vaGWAS
    I.saveScreenshot('GWAS_page.png');
  },

  async selectCohort() {
    I.seeElement(GWASProps.SelectCohortTitle);
    I.click(GWASProps.SelectFirstRadioInput);
  },

  async SelectVariables() {
    // TODO: select multiple variables 
    I.seeElement(GWASProps.SelectConceptTitle);
    I.click(GWASProps.SelectFirstCheckboxInput);
    I.click(GWASProps.SelectSecondCheckboxInput);
  },

  async selectPhenotype() {
    I.seeElement(GWASProps.SelectPhenotypeTitle);
    I.click(GWASProps.SelectFirstRadioInput);
  },

  async setParameters() {
    I.seeElement(GWASProps.SetParameterDiv);
    // TODO: add test parameters
  },

  async ClickNextButton() {
    I.click(GWASProps.NextSpan);
  },

  async ClickPreviousButton() {
    I.seeElement(GWASProps.PreviousSpan);
    I.click(GWASProps.PreviousSpan);
  },

  async SubmitJob() {
    I.seeElement(GWASProps.SubmitButton);
    I.click(GWASProps.SubmitButton);
  },

  async DeleteJob() {
    I.seeElement(GWASProps.JobDeleteButton);
    I.click(GWASProps.JobDeleteButton);
    I.seeElement(GWASProps.JobDeletePopup);
    I.click(GWASProps.JobDeleteYes);
  },
 
  async CheckJobStatus() {
    I.seeElement(GWASProps.JobStatusesButton);
    I.click(GWASProps.JobStatusesButton);
  },
};
