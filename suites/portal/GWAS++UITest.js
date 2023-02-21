const I = actor();

Feature('GWAS++ UI Test @requires-portal @requires-argo-wrapper @requires-cohort-middleware');

Scenario('Submit workflow Continuous Outcome - Continuous Variate Phenotype @GWASUI', async ({
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
    I.click(gwas.props.PhenotypeSubmitButton);
    //check the attrition table for update

    gwas.do.selectContinuousVariate();
    I.wait(3);
    gwas.do.selectFirstConcept();
    I.click(gwas.props.AddButton);
    gwas.do.selectContinuousVariate();
    gwas.do.selectSecondConcept();
    I.click(gwas.props.AddButton);
    I.saveScreenshot('Continuous-ContinuousVariate.png');
    gwas.do.clickNextButton();

    //Step4
    gwas.do.selectAncestry();
    gwas.do.clickNextButton();
    I.wait(3);

    I.seeElement(gwas.props.SubmitDialogBox);
    const jobName = gwas.do.enterJobName();
    await gwas.do.submitJob();
    gwas.do.checkJobStatus();
});

Scenario('Submit workflow Continuous Outcome - Dichotomous Variate Phenotype @GWASUI', async ({
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
    I.click(gwas.props.PhenotypeSubmitButton);
    //check the attrition table for update
     
    gwas.do.selectDichotomouosVariate();
    gwas.do.selectFirstValue();
    gwas.do.selectSecondValue();
    I.wait(5);
    I.seeElement(gwas.props.RenderedEulerDiagram);
    gwas.do.enterPhenotypeName();
    I.click(gwas.props.AddButton);
    I.saveScreenshot('Continuous-DichotomousVariate.png');
    gwas.do.clickNextButton();

    gwas.do.selectAncestry();
    gwas.do.clickNextButton();
    I.wait(3);

    I.seeElement(gwas.props.SubmitDialogBox);
    const jobName = gwas.do.enterJobName();
    await gwas.do.submitJob();
    gwas.do.checkJobStatus();
});

Scenario('Submit workflow Dichotomous Outcome - Continuous Variate Phenotype @GWASUI', async ({
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
    I.click(gwas.props.PhenotypeSubmitButton);
    //check the attrition table for update

    gwas.do.selectContinuousVariate();
    I.wait(3);
    gwas.do.selectFirstConcept();
    I.click(gwas.props.AddButton);
    gwas.do.selectContinuousVariate();
    gwas.do.selectSecondConcept();
    I.click(gwas.props.AddButton);
    I.saveScreenshot('Dichotomous-ContinuousVariate.png');
    gwas.do.clickNextButton();

    gwas.do.selectAncestry();
    gwas.do.clickNextButton();
    I.wait(3);

    I.seeElement(gwas.props.SubmitDialogBox);
    const jobName = gwas.do.enterJobName();
    await gwas.do.submitJob();
    gwas.do.checkJobStatus();
});

Scenario('Submit workflow Dichotomous Outcome - Dichotomous Variate Phenotype @GWASUI', async ({
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
    I.click(gwas.props.PhenotypeSubmitButton);
    //check the attrition table for update

    gwas.do.selectDichotomouosVariate();
    gwas.do.selectFirstValue();
    gwas.do.selectSecondValue();
    I.wait(5);
    I.seeElement(gwas.props.RenderedEulerDiagram);
    gwas.do.enterPhenotypeName();
    I.click(gwas.props.AddButton);
    I.saveScreenshot('Dichotomous-DichotomousVariate.png');
    gwas.do.clickNextButton();

    gwas.do.selectAncestry();
    gwas.do.clickNextButton();
    I.wait(3);

    I.seeElement(gwas.props.SubmitDialogBox);
    const jobName = gwas.do.enterJobName();
    await gwas.do.submitJob();
    gwas.do.checkJobStatus();
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
    I.click(gwas.props.PhenotypeSubmitButton);

    gwas.do.clickPreviousButton();
    I.seeElement(gwas.props.ContinuousPhenotypeButton);
    gwas.do.clickNextButton();

    gwas.do.selectContinuousVariate();
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
    I.dontSeeElement(gwas.props.CohortTableTitle);
});
