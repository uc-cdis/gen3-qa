const GWASUIAppProps = require('./GWASUIAppProps.js');

const { expect } = chai;
const I = actor();

module.exports = {
    goToGWASPage() {
        I.amOnPage(GWASUIAppProps.path); // /analysis/vaGWAS
        I.wait(2);
        I.saveScreenshot('GWAS_page.png');
    },

    clickNextButton() {
        I.seeElement(GWASUIAppProps.NextSpan);
        I.click(GWASUIAppProps.NextSpan);
    },
    
    clickPreviousButton() {
        I.seeElement(GWASUIAppProps.PreviousSpan);
        I.click(GWASUIAppProps.PreviousSpan);
    },
    
    selectCohort() {
        I.seeElement(GWASUIAppProps.CohortTable);
        I.seeElement(GWASUIAppProps.AddCohortButton);
        I.click(GWASUIAppProps.SelectFirstRadioInput);
        I.saveScreenshot('CohortSelect.png');
    },

    attritionTable() {
        I.seeElement(GWASUIAppProps.AttritionTableTitle);
        I.click(GWASUIAppProps.AttritionTableExpandArrow);
        I.seeElement(GWASUIAppProps.ActiveAttritionTable);
    },

    selectContinuousPhenotype() {
        I.seeElement(GWASUIAppProps.ContinuousPhenotypeButton);
        I.click(GWASUIAppProps.ContinuousPhenotypeButton);
    },

    selectDichotomouosPhenotype() {
        I.seeElement(GWASUIAppProps.DichotomousPhenotypeButton);
        I.click(GWASUIAppProps.DichotomousPhenotypeButton);
    },

    selectContinuousPhenotypeConcept() {
        I.seeElement(GWASUIAppProps.PhenotypeHistogram);
        I.seeElement(GWASUIAppProps.PhenotypeTable);
        I.click(GWASUIAppProps.SelectFirstRadioInput);
        I.seeElement(GWASUIAppProps.RenderedContinuousHisto);
        I.saveScreenshot('ContinuousPhenotypeConcept.png');
    },

    selectDichotomouosPhenotypeValues() {
        I.click(GWASUIAppProps.DichotomousPhenotypeValue1);
        I.click('(//div[contains(@title,"Diabetes Demo")])[1]');
        I.click(GWASUIAppProps.GWASWindow);
        I.click(GWASUIAppProps.DichotomousPhenotypeValue2);
        I.click('(//div[contains(@title,"T1D-case")])[2]');
        I.click(GWASUIAppProps.GWASWindow);
        I.saveScreenshot('phenotype.png');
    },

    enterPhenotypeName() {
        const name = `Testing${Date.now()}`;
        I.fillField(GWASUIAppProps.PhenotypeName, name);
    },

    selectContinuousCovariate() {
        I.seeElement(GWASUIAppProps.ContinuousCovariateButton);
        I.click(GWASUIAppProps.ContinuousCovariateButton);
    },

    selectFirstConcept() {
        I.seeElement(GWASUIAppProps.PhenotypeHistogram);
        I.seeElement(GWASUIAppProps.PhenotypeTable);
        I.click(GWASUIAppProps.SelectFirstRadioInput);
        I.seeElement(GWASUIAppProps.RenderedContinuousHisto);
    },

    selectSecondConcept() {
        I.seeElement(GWASUIAppProps.PhenotypeHistogram);
        I.seeElement(GWASUIAppProps.PhenotypeTable);
        I.click(GWASUIAppProps.SelectSecondRadioInput);
        I.seeElement(GWASUIAppProps.RenderedContinuousHisto);
    },

    selectDichotomouosCovariate() {
        I.seeElement(GWASUIAppProps.DichotomousCovariateButton);
        I.click(GWASUIAppProps.DichotomousCovariateButton);
    },

    selectFirstValue() {
        I.click(GWASUIAppProps.DichotomousCovariateValue1);
        I.click('(//div[contains(@title,"Diabetes Demo")])[1]')
        I.click(GWASUIAppProps.GWASWindow);
    },

    selectSecondValue() {
        I.click(GWASUIAppProps.DichotomousCovariateValue2);
        I.click('(//div[contains(@title,"T1D-case")])[2]');
        I.click(GWASUIAppProps.GWASWindow);
    },

    selectAncestry() {
        I.seeElement(GWASUIAppProps.ConfigureGWAS);
        I.click(GWASUIAppProps.AncestryDropDown);
        I.click(GWASUIAppProps.ancestry);
    },

    enterJobName() {
        const jobName = `AutomationTest${Date.now()}`;
        console.log(`the job name is ${jobName}`);
        I.fillField(GWASUIAppProps.EnterJobName,jobName);
        I.saveScreenshot('submissionDialogBox.png');
        return jobName;
    },

    async submitJob() {
        await I.waitForVisible(GWASUIAppProps.JobSubmitButton);
        I.saveScreenshot('BlueButton.png');
        I.click(GWASUIAppProps.JobSubmitButton);
    },

    goToJobStatus() {           
        I.seeElement(GWASUIAppProps.SeeStatusButton);
        I.seeElement(GWASUIAppProps.SubmissionSuccessMessage);
        I.saveScreenshot('Aftersubmitbutton.png');
        I.click(GWASUIAppProps.SeeStatusButton);
        I.amOnPage(GWASUIAppProps.resultsPath);
        I.wait(5);
        I.saveScreenshot('resultsPage.png');
    },

    goToResultPage() {
        I.amOnPage(GWASUIAppProps.resultsPath);
        I.wait(5);
        I.saveScreenshot('resultsPage.png');
    },

    async getUserWF() {
        const userWFs =  await I.sendGetRequest(
            `${GWASUIAppProps.gwasAPI}/workflows`,
            users.mainAcct.accessTokenHeader,
        );
        const workflowData = userWFs.data;
        expect(workflowData).to.not.be.empty;
        return workflowData[0];
    },

    async getWFName() {
        const data = await this.getUserWF();
        const wfName = data[0].name;
        if (process.env.DEBUG === 'true') {
            console.log(`### workflow name : ${wfName}`);
        };
        return wfName;
    },

    async getWFUID() {
        const data = await this.getUserWF();
        const wfUID = data[0].uid;
        if (process.env.DEBUG === 'true') {
            console.log(`### workflow uid : ${wfUID}`);
        };
        return wfUID;
    },

   async getWFStatus() {
        const data = await this.getUserWF();
        const wfStatus = data[0].phase;
        if (process.env.DEBUG === 'true') {
            console.log(`### workflow status : ${wfStatus}`);
        };
        return wfStatus;
    },

    checkWFStatus(jobname) {
        

    }
};
