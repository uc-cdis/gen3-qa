const GWASUIAppProps = require('./GWASProps.js');
const chai = require('chai');
const users = require('../../../utils/user');
const fs = require('fs');
const { sleepMS } = require('../../../utils/apiUtil.js');

const { expect } = chai;
const I = actor();

module.exports = {

    goToGWASPage() {
        I.amOnPage(GWASUIAppProps.path); // /analysis/vaGWAS
        I.wait(2);
        I.saveScreenshot('GWAS_page.png');
    },

    goToAnalysisPage() {
        I.amOnPage(GWASUIAppProps.analysisPath);
        I.wait(5);
        I.saveScreenshot('analysis.png');
    },

    async selectTeamProject1() {
        I.seeElement(GWASUIAppProps.TeamProjectSelectorBox);
        I.click(GWASUIAppProps.TeamProjectSelectorDropdown);
        I.click(GWASUIAppProps.TeamProject1Select);
        I.saveScreenshot('GwasTeamSelect1.png');
        I.click(GWASUIAppProps.TeamProjectSubmitButton);
        I.seeElement(GWASUIAppProps.TeamHeader);
        const text = await I.grabTextFrom(GWASUIAppProps.TeamHeader);
        expect(text).to.equal('Team Project / /gwas_projects/project1');
    },

    async changeTeamProject() {
        I.click(GWASUIAppProps.ChangeTeamProject);
        I.seeElement(GWASUIAppProps.TeamProjectSelectorBox);
        I.click(GWASUIAppProps.TeamProjectSelectorDropdown);
        I.click(GWASUIAppProps.TeamProject2Select);
        I.saveScreenshot('GwasTeamSelect2.png');
        I.click(GWASUIAppProps.TeamProjectSubmitButton);
        I.seeElement(GWASUIAppProps.TeamHeader);
        const text = await I.grabTextFrom(GWASUIAppProps.TeamHeader);
        expect(text).to.equal('Team Project / /gwas_projects/project2');
    },

    unauthorizedUserSelectTeamProject() {
        I.seeElement(GWASUIAppProps.TeamProjectSelectorBox);
        I.click(GWASUIAppProps.TeamProjectSelectorDropdown);
        I.saveScreenshot('UnauthorizedUserDropdownBox.png')
        I.dontSeeElement(GWASUIAppProps.TeamProject1Select);
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
        I.click('(//div[contains(@title,"Test cohortC - Large (do not run generate)")])[1]');
        I.click(GWASUIAppProps.GWASWindow);
        I.click(GWASUIAppProps.DichotomousPhenotypeValue2);
        I.click('(//div[contains(@title,"Test cohortD - Large (do not run generate)")])[2]');
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
        I.click('(//div[contains(@title,"Test cohortC - Large (do not run generate)")])[1]');
        I.click(GWASUIAppProps.GWASWindow);
    },

    selectSecondValue() {
        I.click(GWASUIAppProps.DichotomousCovariateValue2);
        I.click('(//div[contains(@title,"Test cohortD - Large (do not run generate)")])[2]');
        I.click(GWASUIAppProps.GWASWindow);
    },

    selectAncestry() {
        I.seeElement(GWASUIAppProps.ConfigureGWAS);
        I.click(GWASUIAppProps.AncestryDropDown);
        I.click(GWASUIAppProps.ancestry);
    },

    enterJobName() {
        const jobName = `AutomationTest${Date.now()}`;
        console.log(`### the job name is ${jobName}`);
        I.fillField(GWASUIAppProps.EnterJobName,jobName);
        I.saveScreenshot('submissionDialogBox.png');
        return jobName;
    },

    async submitJob() {
        I.saveScreenshot('BlueButton.png');
        await I.waitForVisible(GWASUIAppProps.JobSubmitButton, 10);
        I.click(GWASUIAppProps.JobSubmitButton);
    },

    async goToJobStatus() {           
        I.seeElement(GWASUIAppProps.SeeStatusButton);
        I.seeElement(GWASUIAppProps.SubmissionSuccessMessage);
        I.saveScreenshot('Aftersubmitbutton.png');
        I.click(GWASUIAppProps.SeeStatusButton);
        I.amOnPage(GWASUIAppProps.resultsPath);
        I.wait(5);
        I.saveScreenshot('resultsPage.png');
    },

    async goToResultPage() {
        I.amOnPage(GWASUIAppProps.resultsPath);
        I.wait(5);
        I.seeElement(GWASUIAppProps.ExecutionButton);
        I.saveScreenshot('resultsPage.png');
    },

    async getWFUID() {
        const data = await this.getUserWF();
        const wfUID = data.uid;
        if (process.env.DEBUG === 'true') {
            console.log(`### workflow uid : ${wfUID}`);
        };
        return wfUID;
    },

    async executionButton() {
        I.click(GWASUIAppProps.ExecutionButton);
        I.wait(5);
        I.saveScreenshot('executionButtonPage.png');
        I.seeElement(GWASUIAppProps.executionView);
        I.seeElement(GWASUIAppProps.executionLogs);
        I.click(GWASUIAppProps.backButton);
    },

    async resultsButton() {
        I.click(GWASUIAppProps.ResultsButton);
        I.wait(5);
        I.saveScreenshot('resultButtonPage.png');
        I.seeElement(GWASUIAppProps.ResultsButton);
        // I.seeElement(GWASUIAppProps.manhattanPlot);
        I.seeElement(GWASUIAppProps.downloadAllResults);
        I.click(GWASUIAppProps.resultsBackButton);
    },

    actionButton() {
        I.seeElement(GWASUIAppProps.actionButton);
        I.click(GWASUIAppProps.actionButton);
        I.seeElement(GWASUIAppPro.downloadAllResults);
    },

    async getUserWF(job) {
        console.log('### Getting workflows for the user ...');
        const userWFs =  await I.sendGetRequest(
            `${GWASUIAppProps.gwasAPI}`,
            users.mainAcct.accessTokenHeader,
        );
        const workflowData = userWFs.data;
        if (process.env.DEBUG === 'true') {
            console.log(`### ${JSON.stringify(workflowData)}`);
        };
        expect(workflowData).to.not.be.empty;
        var wf = workflowData.find((obj) => obj.wf_name === job)
        console.log("Matching object:", wf);
        return wf;
    },

    async getWFStatus(job) {
        const data = await this.getUserWF(job);
        const wfStatus = data.phase;
        console.log(`### getWFStatus workflow status : ${wfStatus}`);
        return wfStatus;
    },

    // checkWFsInTable() {
    //     I.seeElement(GWASUIAppProps.ResultsTable);

    // },

    async checkStatusPolling(job, status) {
        const attempts = 5;
        await sleepMS(10000);
        let workflowStatus = status;
        if (workflowStatus !== 'Running'){
            console.log('### workflowStatus: ', workflowStatus);
        } else {
            console.log('### workflow is Running. Starting the polling process ...');
            for(let i = 1; i < attempts; i += 1) {
                try {
                    console.log(`###Checking the status of ${i}`);
                    workflowStatus = await this.getWFStatus(job);
                    console.log(`### attempt ${i} status :${workflowStatus}`);
                    if (workflowStatus !== 'Running') {
                        break;
                    } else {
                        console.log(`### workflow has not completed yet - attempt ${i}`);
                        await sleepMS(10000);
                        if (i === attempts) {
                            throw new Error(`### Error : The workflow has not finished yet. The status of the workflow is ${workflowStatus}`);
                        }
                    }
                } catch (e) {
                    throw new Error(`Failed to get status of job ${job} on attempts ${i} : ${e.message}`)
                }
            }
        }
        return workflowStatus;
    },


    async checkStatus(job, failed = false) {
        const wkStatus = await this.getWFStatus(job);
        const status = await this.checkStatusPolling(job, wkStatus);
        console.log(`### workflow status : ${status}`);
        if (process.env.DEBUG === 'true') {
            console.log(`### checkStatus workflow status : ${status}`);
        };
        // for negative testing
        // if the failed is set to true, this workflow with trigger
        let failedStates = [ "Failed", "Error" ];
        if (failed) {
            expect(status).to.be.oneOf(failedStates);
        } else if (status === "Failed") {
            console.log('Workflow has Failed');
        } else {
            expect(status).to.equal('Succeeded');
            console.log(`### Status : ${status}.Workflow ${workflowName} has completed successfully`);
            // check I am on Page
            // check if the user is logged in or not, if not then login again and continue the test
            await this.executionButton();
            await this.resultsButton();
        }
    },

        // async checkStatusPolling(job, status) {
    //     const attempts = 4;
    //     let workflowStatus = status;
    //     if (workflowStatus !== 'Running') {
    //         console.log('### The workflow is done. Worksflow status : ' + workflowStatus)
    //     }
    //     if (workflowStatus === 'Running') {
    //         console.log('The status of the workflow is Running');
    //         console.log(`### waiting for status polling for ${job}...`)
    //         // start the polling mechanism
    //         for (let i = 1; i < attempts; i += 1) {
    //             console.log(`Checking the status of the workflow : attempt ${i} ...`);
    //             workflowStatus = await this.getWFStatus(job)
    //             if (process.env.DEBUG === 'true') {
    //                 console.log(workflowStatus);
    //             }

    //             if (workflowStatus !== 'Running') {
    //                 console.log('### The workflow is done ...')
    //                 break;
    //             } else {
    //                 console.log(`The workflow has not completed yet - attempt ${i}`);
    //                 if (i === attempts - 1) {
    //                     throw new Error(`### Error : The workflow has not finished yet. The status of the workflow is ${workflowStatus}`);
    //                 }
    //             }
    //         }
    //     }
    //     return workflowStatus;
    // },

}
