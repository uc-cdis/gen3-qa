// How to execute the test ?
// 
// Initially we are executing this test locally. TBD - if we want to execute this test in CI/CD? And how to deploy the test
// Also we need to be aware that the smallest workflow runs for 30-35mins which means this test would take long time
// We can add this test as a part of NIGHTLY BUILD runs and also add some polling logic to check the status of the workflow after certain intervals

// to execute this test locally
// 1. docker-compose -f docker-compose-test-infra-arm64.yaml down && docker-compose -f docker-compose-test-infra-arm64.yaml up -d
// 2. GEN3_SKIP_PROJ_SETUP=true RUNNING_LOCAL=true NAMESPACE=qa-mickey PORTAL_SUFFIX="" npm test -- --verbose suites/portal/GWASUIAppTest.js

// Also if you want to execute this test against staging. Use the same command by adding parameter `GEN3_COMMONS_HOSTNAME=va-testing.data-commons.org` 
// and remove `NAMESPACE=qa-mickey`.

const I = actor();

Feature('GWAS App UI Test @requires-portal @requires-argo-wrapper @requires-cohort-middleware');

I.cache = {};
I.cache.workflows = [ 'AutomationTest1710788183101', 'AutomationTest1710358143247'];

Scenario('Submit workflow Continuous Outcome - Continuous Covariate Phenotype @GWASUI', async ({
    I, home, users, gwas
}) => {
    I.useWebDriverTo('set window size', async ({ browser }) => {
        browser.setWindowSize(1920, 1080);
    });
    home.do.goToHomepage();
    await home.complete.login(users.mainAcct);
    I.saveScreenshot('homepage.png');

    gwas.do.goToAnalysisPage();
    gwas.do.selectTeamProject1();
    gwas.do.goToGWASPage();
    gwas.do.selectCohort();
    gwas.do.attritionTable();
    gwas.do.clickNextButton();

    gwas.do.selectContinuousPhenotype();
    I.wait(3);
    gwas.do.selectContinuousPhenotypeConcept();
    I.click(gwas.props.ContinuousPhenoSubmitButton);
    //TODO : check the attrition table for update

    gwas.do.selectContinuousCovariate();
    I.wait(3);
    gwas.do.selectFirstConcept();
    I.click(gwas.props.ContinuousAddButton);
    gwas.do.selectContinuousCovariate();
    gwas.do.selectSecondConcept();
    I.click(gwas.props.ContinuousAddButton);
    I.saveScreenshot('Continuous-ContinuousCovariate.png');
    gwas.do.clickNextButton();

    //Step4
    gwas.do.selectAncestry();
    gwas.do.clickNextButton();
    I.wait(3);

    I.seeElement(gwas.props.SubmitDialogBox);
    const jobName = gwas.do.enterJobName();
    console.log(jobName);
    I.cache.workflows.push(jobName);
    console.log(I.cache.workflows);
    await gwas.do.submitJob();
    gwas.do.goToJobStatus();
});

Scenario('Submit workflow Continuous Outcome - Dichotomous Covariate Phenotype @GWASUI', async ({
    I, home, users, gwas
}) => {
    I.useWebDriverTo('set window size', async ({ browser }) => {
        browser.setWindowSize(1920, 1200);
    });
    home.do.goToHomepage();
    await home.complete.login(users.mainAcct);
    I.saveScreenshot('homepage.png');

    gwas.do.goToAnalysisPage();
    gwas.do.selectTeamProject1();
    gwas.do.goToGWASPage();
    gwas.do.selectCohort();
    gwas.do.attritionTable();
    gwas.do.clickNextButton();

    gwas.do.selectContinuousPhenotype();
    I.wait(3);
    gwas.do.selectContinuousPhenotypeConcept();
    I.click(gwas.props.ContinuousPhenoSubmitButton);
    //TODO : check the attrition table for update
     
    gwas.do.selectDichotomouosCovariate();
    gwas.do.selectFirstValue();
    gwas.do.selectSecondValue();
    I.wait(10);
    I.saveScreenshot('RenderedEulerDiagram.png'),
    I.seeElement(gwas.props.RenderedEulerDiagram);
    gwas.do.enterPhenotypeName();
    I.click(gwas.props.DichoAddButton);
    I.saveScreenshot('Continuous-DichotomousCovariate.png');
    gwas.do.clickNextButton();

    gwas.do.selectAncestry();
    gwas.do.clickNextButton();
    I.wait(3);

    I.seeElement(gwas.props.SubmitDialogBox);
    const jobName = gwas.do.enterJobName();
    I.cache.workflows.push(jobName);
    await gwas.do.submitJob();
    gwas.do.goToJobStatus();
});

Scenario('Submit workflow Dichotomous Outcome - Continuous Covariate Phenotype @GWASUI', async ({
    I, home, users, gwas
}) => {
    I.useWebDriverTo('set window size', async ({ browser }) => {
        browser.setWindowSize(1920, 1080);
    });
    home.do.goToHomepage();
    await home.complete.login(users.mainAcct);
    I.saveScreenshot('homepage.png');

    gwas.do.goToAnalysisPage();
    gwas.do.selectTeamProject1();
    gwas.do.goToGWASPage();
    gwas.do.selectCohort();
    gwas.do.attritionTable();
    gwas.do.clickNextButton(); 

    gwas.do.selectDichotomouosPhenotype();
    I.wait(3);
    gwas.do.selectDichotomouosPhenotypeValues();
    I.seeElement(gwas.props.RenderedEulerDiagram);
    gwas.do.enterPhenotypeName();
    I.click(gwas.props.DichoPhenoSubmitButton);
    //TODO : check the attrition table for update

    gwas.do.selectContinuousCovariate();
    I.wait(3);
    gwas.do.selectFirstConcept();
    I.click(gwas.props.ContinuousAddButton);
    gwas.do.selectContinuousCovariate();
    gwas.do.selectSecondConcept();
    I.click(gwas.props.ContinuousAddButton);
    I.saveScreenshot('Dichotomous-ContinuousCovariate.png');
    gwas.do.clickNextButton();

    gwas.do.selectAncestry();
    gwas.do.clickNextButton();
    I.wait(3);

    I.seeElement(gwas.props.SubmitDialogBox);
    const jobName = gwas.do.enterJobName();
    I.cache.workflows.push(jobName);
    await gwas.do.submitJob();
    gwas.do.goToJobStatus();
});

Scenario('Submit workflow Dichotomous Outcome - Dichotomous Covariate Phenotype @GWASUI', async ({
    I, home, users, gwas
}) => {
    I.useWebDriverTo('set window size', async ({ browser }) => {
        browser.setWindowSize(1920, 1080);
    });
    home.do.goToHomepage();
    await home.complete.login(users.mainAcct);
    I.saveScreenshot('homepage.png');

    gwas.do.goToAnalysisPage();
    gwas.do.selectTeamProject1();
    gwas.do.goToGWASPage();
    gwas.do.selectCohort();
    gwas.do.attritionTable();
    gwas.do.clickNextButton(); 

    gwas.do.selectDichotomouosPhenotype();
    I.wait(3);
    gwas.do.selectDichotomouosPhenotypeValues();
    I.seeElement(gwas.props.RenderedEulerDiagram);
    gwas.do.enterPhenotypeName();
    I.click(gwas.props.DichoPhenoSubmitButton);
    //TODO : check the attrition table for update

    gwas.do.selectDichotomouosCovariate();
    gwas.do.selectFirstValue();
    gwas.do.selectSecondValue();
    I.wait(5);
    I.seeElement(gwas.props.RenderedEulerDiagram);
    gwas.do.enterPhenotypeName();
    I.click(gwas.props.DichoAddButton);
    I.saveScreenshot('Dichotomous-DichotomousCovariate.png');
    gwas.do.clickNextButton();

    gwas.do.selectAncestry();
    gwas.do.clickNextButton();
    I.wait(3);

    I.seeElement(gwas.props.SubmitDialogBox);
    const jobName = gwas.do.enterJobName();
    I.cache.workflows.push(jobName);
    await gwas.do.submitJob();
    gwas.do.goToJobStatus();
});

// this scenarios is largely dependent on the success of submissions of workflows in previous scenarios
Scenario('GWAS Result App @GWASUI', async ({ 
    I, home, users, gwas 
}) => {
    I.useWebDriverTo('set window size', async ({ browser }) => {
        browser.setWindowSize(1920, 1080);
    });
    home.do.goToHomepage();
    await home.complete.login(users.mainAcct);

    gwas.do.goToAnalysisPage();
    gwas.do.selectTeamProject1();
    await gwas.do.goToResultPage();
    console.log(I.cache.workflows);
    
    // check status of all the workflows which was started in this test
    I.cache.workflows.forEach(async (job) => {
        console.log(job);
        await gwas.do.checkStatus(job);
        console.log('-----')
    })
}); 

Scenario('Test next and previous buttons GWAS page @GWASUI', async ({
    I, home, users, gwas
}) => {
    I.useWebDriverTo('set window size', async ({ browser }) => {
        browser.setWindowSize(1920, 1080);
    });
    home.do.goToHomepage();
    await home.complete.login(users.mainAcct);

    gwas.do.goToAnalysisPage();
    gwas.do.selectTeamProject1();
    gwas.do.goToGWASPage();
    gwas.do.selectCohort();
    gwas.do.clickNextButton();

    gwas.do.clickPreviousButton();
    I.seeElement(gwas.props.checkedRadio);
    gwas.do.clickNextButton();

    gwas.do.selectContinuousPhenotype();
    I.wait(3);
    gwas.do.selectContinuousPhenotypeConcept();
    I.click(gwas.props.ContinuousPhenoSubmitButton);

    gwas.do.clickPreviousButton();
    I.seeElement(gwas.props.ContinuousPhenotypeButton);
    gwas.do.clickNextButton();

    gwas.do.selectContinuousCovariate();
    gwas.do.selectFirstConcept();
    gwas.do.clickNextButton();
    
    gwas.do.selectAncestry();
    gwas.do.clickNextButton();
    I.wait(3);

    I.seeElement(gwas.props.SubmitDialogBox);
}); 

Scenario('Unauthorized access to GWAS @GWASUI', async ({
    I, home, users, gwas
}) => {
    I.useWebDriverTo('set window size', async ({ browser }) => {
        browser.setWindowSize(1920, 1080);
    });
    home.do.goToHomepage();
    await home.complete.login(users.auxAcct1);

    gwas.do.goToAnalysisPage();
    gwas.do.unauthorizedUserSelectTeamProject();
});