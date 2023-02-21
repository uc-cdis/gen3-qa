const GWASppProps = require('../GWASpp/GWASppProps.js');

const I = actor();

module.exports = {
    goToGWASPage() {
        I.amOnPage(GWASppProps.path); // /analysis/vaGWAS
        I.wait(2);
        I.saveScreenshot('GWAS_page.png');
    },

    clickNextButton() {
        I.seeElement(GWASppProps.NextSpan);
        I.click(GWASppProps.NextSpan);
    },
    
    clickPreviousButton() {
        I.seeElement(GWASppProps.PreviousSpan);
        I.click(GWASppProps.PreviousSpan);
    },
    
    selectCohort() {
        I.seeElement(GWASppProps.CohortTableTitle);
        I.seeElement(GWASppProps.AddCohortButton);
        I.click(GWASppProps.SelectFirstRadioInput);
        I.saveScreenshot('CohortSelect.png');
    },

    attritionTable() {
        I.seeElement(GWASppProps.AttritionTableTitle);
        I.click(GWASppProps.AttritionTableExpandArrow);
        I.seeElement(GWASppProps.ActiveAttritionTable);
    },

    selectContinuousPhenotype() {
        I.seeElement(GWASppProps.ContinuousPhenotypeButton);
        I.click(GWASppProps.ContinuousPhenotypeButton);
    },

    selectDichotomouosPhenotype() {
        I.seeElement(GWASppProps.DichotomousPhenotypeButton);
        I.click(GWASppProps.DichotomousPhenotypeButton);
    },

    selectContinuousPhenotypeConcept() {
        I.seeElement(GWASppProps.PhenotypeHistogram);
        I.seeElement(GWASppProps.PhenotypeTable);
        I.click(GWASppProps.SelectFirstRadioInput);
        I.seeElement(GWASppProps.RenderedContinuousHisto);
        I.saveScreenshot('ContinuousPhenotypeConcept.png');
    },

    selectDichotomouosPhenotypeValues() {
        I.click(GWASppProps.DichotomousPhenotypeValue1);
        I.click('(//div[contains(@title,"Diabetes Demo")])[1]');
        I.click(GWASppProps.GWASWindow);
        I.click(GWASppProps.DichotomousPhenotypeValue2);
        I.click('(//div[contains(@title,"T1D-case")])[2]');
        I.click(GWASppProps.GWASWindow);
        I.saveScreenshot('phenotype.png');
    },

    enterPhenotypeName() {
        const name = `Testing${Date.now()}`;
        I.fillField(GWASppProps.PhenotypeName, name);
    },

    selectContinuousVariate() {
        I.seeElement(GWASppProps.ContinuousVariateButton);
        I.click(GWASppProps.ContinuousVariateButton);
    },

    selectFirstConcept() {
        I.seeElement(GWASppProps.PhenotypeHistogram);
        I.seeElement(GWASppProps.PhenotypeTable);
        I.click(GWASppProps.SelectFirstRadioInput);
        I.seeElement(GWASppProps.RenderedContinuousHisto);
    },

    selectSecondConcept() {
        I.seeElement(GWASppProps.PhenotypeHistogram);
        I.seeElement(GWASppProps.PhenotypeTable);
        I.click(GWASppProps.SelectSecondRadioInput);
        I.seeElement(GWASppProps.RenderedContinuousHisto);
    },

    selectDichotomouosVariate() {
        I.seeElement(GWASppProps.DichotomousVariateButton);
        I.click(GWASppProps.DichotomousVariateButton);
    },

    selectFirstValue() {
        I.click(GWASppProps.DichotomousVariateValue1);
        // I.waitForText(GWASppProps.DichotomousOption1, 5);
        I.click('(//div[contains(@title,"Diabetes Demo")])[1]')
        I.click(GWASppProps.GWASWindow);
    },

    selectSecondValue() {
        I.click(GWASppProps.DichotomousVariateValue2);
        // I.waitForText(GWASppProps.DichotomousOption2, 5);
        I.click('(//div[contains(@title,"T1D-case")])[2]');
        I.click(GWASppProps.GWASWindow);
    },

    selectAncestry() {
        I.seeElement(GWASppProps.ConfigureGWAS);
        I.click(GWASppProps.AncestryDropDown);
        I.waitForText(GWASppProps.ancestry, 5);
        I.click(`//*[contains(text(),'${GWASppProps.ancestry}')]`);
    },

    enterJobName() {
        const jobName = `AutomationTest${Date.now()}`;
        console.log(`the job name is ${jobName}`);
        I.fillField(GWASppProps.EnterJobName,jobName);
        I.saveScreenshot('submissionDialogBox.png');
        return jobName;
    },

    async submitJob() {
        await I.waitForVisible(GWASppProps.JobSubmitButton);
        I.saveScreenshot('BlueButton.png');
        I.click(GWASppProps.JobSubmitButton);
    },

    checkJobStatus() {           
        I.seeElement(GWASppProps.SeeStatusButton);
        I.seeElement(GWASppProps.SubmissionSuccessMessage);
        I.saveScreenshot('Aftersubmitbutton.png');
        I.click(GWASppProps.SeeStatusButton);
        I.amOnPage(GWASppProps.resultsPath);
        I.wait(5);
        I.saveScreenshot('resultsPage.png');
    },
};