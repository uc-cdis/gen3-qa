const GWASppProps = require('../../services/portal/GWASpp/GWASppProps.js');
const GWASppTasks = require('../../services/portal/GWASpp/GWASppTasks.js');

const I = actor();

Feature('GWAS++ UI Test @requires-portal @requires-argo-wrapper @requires-cohort-middleware');

Scenario('Submit workflow Continuous Outcome - Continuous Variate Phenotype @GWASUI', async ({
    I, home, users
}) => {
    I.useWebDriverTo('set window size', async ({ browser }) => {
        browser.setWindowSize(1920, 1080);
    });
    home.do.goToHomepage();
    await home.complete.login(users.mainAcct);
    I.saveScreenshot('homepage.png');

    GWASppTasks.goToGWASPage();
    GWASppTasks.selectCohort();
    GWASppTasks.attritionTable();
    GWASppTasks.clickNextButton();

    GWASppTasks.selectContinuousPhenotype();
    I.wait(3);
    GWASppTasks.selectContinuousPhenotypeConcept();
    I.click(GWASppProps.PhenotypeSubmitButton);
    //check the attrition table for update

    GWASppTasks.selectContinuousVariate();
    I.wait(3);
    GWASppTasks.selectFirstConcept();
    I.click(GWASppProps.AddButton);
    GWASppTasks.selectContinuousVariate();
    GWASppTasks.selectSecondConcept();
    I.click(GWASppProps.AddButton);
    I.saveScreenshot('Continuous-ContinuousVariate.png');
    GWASppTasks.clickNextButton();

    //Step4
    GWASppTasks.selectAncestry();
    GWASppTasks.clickNextButton();
    I.wait(3);

    I.seeElement(GWASppProps.SubmitDialogBox);
    const jobName = GWASppTasks.enterJobName();
    await GWASppTasks.submitJob();
    GWASppTasks.checkJobStatus();
});

Scenario('Submit workflow Continuous Outcome - Dichotomous Variate Phenotype @GWASUI', async ({
    I, home, users
}) => {
    I.useWebDriverTo('set window size', async ({ browser }) => {
        browser.setWindowSize(1920, 1200);
    });
    home.do.goToHomepage();
    await home.complete.login(users.mainAcct);
    I.saveScreenshot('homepage.png');

    GWASppTasks.goToGWASPage();
    GWASppTasks.selectCohort();
    GWASppTasks.attritionTable();
    GWASppTasks.clickNextButton();

    GWASppTasks.selectContinuousPhenotype();
    I.wait(3);
    GWASppTasks.selectContinuousPhenotypeConcept();
    I.click(GWASppProps.PhenotypeSubmitButton);
    //check the attrition table for update
     
    GWASppTasks.selectDichotomouosVariate();
    GWASppTasks.selectFirstValue();
    GWASppTasks.selectSecondValue();
    I.wait(5);
    I.seeElement(GWASppProps.RenderedEulerDiagram);
    GWASppTasks.enterPhenotypeName();
    I.click(GWASppProps.AddButton);
    I.saveScreenshot('Continuous-DichotomousVariate.png');
    GWASppTasks.clickNextButton();

    GWASppTasks.selectAncestry();
    GWASppTasks.clickNextButton();
    I.wait(3);

    I.seeElement(GWASppProps.SubmitDialogBox);
    const jobName = GWASppTasks.enterJobName();
    await GWASppTasks.submitJob();
    GWASppTasks.checkJobStatus();
});

Scenario('Submit workflow Dichotomous Outcome - Continuous Variate Phenotype @GWASUI', async ({
    I, home, users
}) => {
    I.useWebDriverTo('set window size', async ({ browser }) => {
        browser.setWindowSize(1920, 1080);
    });
    home.do.goToHomepage();
    await home.complete.login(users.mainAcct);
    I.saveScreenshot('homepage.png');

    GWASppTasks.goToGWASPage();
    GWASppTasks.selectCohort();
    GWASppTasks.attritionTable();
    GWASppTasks.clickNextButton(); 

    GWASppTasks.selectDichotomouosPhenotype();
    I.wait(3);
    GWASppTasks.selectDichotomouosPhenotypeValues();
    I.seeElement(GWASppProps.RenderedEulerDiagram);
    GWASppTasks.enterPhenotypeName();
    I.click(GWASppProps.PhenotypeSubmitButton);
    //check the attrition table for update

    GWASppTasks.selectContinuousVariate();
    I.wait(3);
    GWASppTasks.selectFirstConcept();
    I.click(GWASppProps.AddButton);
    GWASppTasks.selectContinuousVariate();
    GWASppTasks.selectSecondConcept();
    I.click(GWASppProps.AddButton);
    I.saveScreenshot('Dichotomous-ContinuousVariate.png');
    GWASppTasks.clickNextButton();

    GWASppTasks.selectAncestry();
    GWASppTasks.clickNextButton();
    I.wait(3);

    I.seeElement(GWASppProps.SubmitDialogBox);
    const jobName = GWASppTasks.enterJobName();
    await GWASppTasks.submitJob();
    GWASppTasks.checkJobStatus();
});

Scenario('Submit workflow Dichotomous Outcome - Dichotomous Variate Phenotype @GWASUI', async ({
    I, home, users
}) => {
    I.useWebDriverTo('set window size', async ({ browser }) => {
        browser.setWindowSize(1920, 1080);
    });
    home.do.goToHomepage();
    await home.complete.login(users.mainAcct);
    I.saveScreenshot('homepage.png');

    GWASppTasks.goToGWASPage();
    GWASppTasks.selectCohort();
    GWASppTasks.attritionTable();
    GWASppTasks.clickNextButton(); 

    GWASppTasks.selectDichotomouosPhenotype();
    I.wait(3);
    GWASppTasks.selectDichotomouosPhenotypeValues();
    I.seeElement(GWASppProps.RenderedEulerDiagram);
    GWASppTasks.enterPhenotypeName();
    I.click(GWASppProps.PhenotypeSubmitButton);
    //check the attrition table for update

    GWASppTasks.selectDichotomouosVariate();
    GWASppTasks.selectFirstValue();
    GWASppTasks.selectSecondValue();
    I.wait(5);
    I.seeElement(GWASppProps.RenderedEulerDiagram);
    GWASppTasks.enterPhenotypeName();
    I.click(GWASppProps.AddButton);
    I.saveScreenshot('Dichotomous-DichotomousVariate.png');
    GWASppTasks.clickNextButton();

    GWASppTasks.selectAncestry();
    GWASppTasks.clickNextButton();
    I.wait(3);

    I.seeElement(GWASppProps.SubmitDialogBox);
    const jobName = GWASppTasks.enterJobName();
    await GWASppTasks.submitJob();
    GWASppTasks.checkJobStatus();
});

Scenario('Test next and previous buttons GWAS page @GWASUI', async ({
    I, home, users
}) => {
    I.useWebDriverTo('set window size', async ({ browser }) => {
        browser.setWindowSize(1920, 1080);
    });
    home.do.goToHomepage();
    await home.complete.login(users.mainAcct);

    GWASppTasks.goToGWASPage();
    GWASppTasks.selectCohort();
    GWASppTasks.clickNextButton();

    GWASppTasks.clickPreviousButton();
    I.seeElement(GWASppProps.checkedRadio);
    GWASppTasks.clickNextButton();

    GWASppTasks.selectContinuousPhenotype();
    I.wait(3);
    GWASppTasks.selectContinuousPhenotypeConcept();
    I.click(GWASppProps.PhenotypeSubmitButton);

    GWASppTasks.clickPreviousButton();
    I.seeElement(GWASppProps.ContinuousPhenotypeButton);
    GWASppTasks.clickNextButton();

    GWASppTasks.selectContinuousVariate();
    GWASppTasks.selectFirstConcept();
    GWASppTasks.clickNextButton();
    
    GWASppTasks.selectAncestry();
    GWASppTasks.clickNextButton();
    I.wait(3);

    I.seeElement(GWASppProps.SubmitDialogBox);
});   

Scenario('Unauthorized access to GWAS @GWASUI', async ({
    I, home, users
}) => {
    I.useWebDriverTo('set window size', async ({ browser }) => {
        browser.setWindowSize(1920, 1080);
    });
    home.do.goToHomepage();
    await home.complete.login(users.auxAcct1);

    GWASppTasks.goToGWASPage();

    I.seeElement(GWASppProps.UnauthorizedSpinner);
    I.dontSeeElement(GWASppProps.CohortTableTitle);
});
