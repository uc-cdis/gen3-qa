const I = actor();

Feature('GWAS++ UI Test @requires-portal @requires-argo-wrapper @requires-cohort-middleware');

Scenario('Submit workflow Continuous Outcome - Continuous Covariate Phenotype @GWASUI', async ({
    I, home, users, gwas
}) => {
    I.useWebDriverTo('set window size', async ({ browser }) => {
        browser.setWindowSize(1920, 1080);
    });
    home.do.goToHomepage();
    await home.complete.login(users.mainAcct);
    I.saveScreenshot('homepage.png');

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
    await gwas.do.submitJob();
    gwas.do.goToJobStatus();
});

Scenario('GWAS Result V2 App @GWASUI', async ({ 
    I, home, users, gwas 
}) => {
    I.useWebDriverTo('set window size', async ({ browser }) => {
        browser.setWindowSize(1920, 1080);
    });
    home.do.goToHomepage();
    await home.complete.login(users.mainAcct);
    gwas.do.goToResultPage();
    // check the status of the job submitted by the user
    gwas.do.checkWFStatus();
});

Scenario('Test next and previous buttons GWAS page @GWASUI', async ({
    I, home, users, gwas
}) => {
    I.useWebDriverTo('set window size', async ({ browser }) => {
        browser.setWindowSize(1920, 1080);
    });
    home.do.goToHomepage();
    await home.complete.login(users.mainAcct);

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

    gwas.do.goToGWASPage();

    I.seeElement(gwas.props.UnauthorizedSpinner);
    I.dontSeeElement(gwas.props.CohortTable);
});
