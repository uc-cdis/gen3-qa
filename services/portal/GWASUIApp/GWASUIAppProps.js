module.exports = {
    path: 'analysis/GWASUIApp',
    resultsPath: 'analysis/GWASResults',

    // GWAS++ elements
    NextSpan: '//span[contains(text(),\'Next\')]',
    PreviousSpan: '//span[contains(text(),\'Previous\')]',
    GWASWindow: '//div[@class="select-container"]',
    checkedRadio: '(//*[@class="ant-radio ant-radio-checked"])',
    // from step1
    AddCohortButton: { css: 'button[data-tour="cohort-add"]' },
    CohortTable: { css: '.GWASUI-mainTable' },
    ContinuousPhenotypeButton: '//span[contains(text(),"Add Continuous Outcome Phenotype")]',
    DichotomousPhenotypeButton: { css: 'button[data-tour="select-outcome-dichotomous"]' },
    AttritionTableExpandArrow: '//div[@class="ant-collapse-expand-icon"]',
    ActiveAttritionTable: '//div[@data-tour="attrition-table"]',
    AttritionTableTitle: '//span[contains(text(),"Attrition Table")]',
    tablerow1: '//tbody/tr[1]',
    //from step2
    PhenotypeHistogram: '//div[@class="phenotype-histogram"]',
    RenderedContinuousHisto: '//div[@role="region"]//*[name()="svg"]',
    PhenotypeTable: '//div[@class="ant-table-container"]',
    ContinuousPhenoSubmitButton: { css: 'button[class="submit-button"]' },
    DichoPhenoSubmitButton: { css: 'button[class="submit-button GWASUI-btnEnable GWASUI-dichBtn"]' },
    SelectFirstRadioInput: '(//input[@class="ant-radio-input" and not(@disabled)])[1]',
    DichotomousPhenotypeValue1: '(//div[contains(@class,"ant-select-selector")])[1]',
    DichotomousPhenotypeValue2: '(//div[contains(@class,"ant-select-selector")])[2]',
    //for step3
    ContinuousCovariateButton: '//span[contains(text(),"Add Continuous Covariate")]',
    DichotomousCovariateButton: { css: 'button[data-tour="select-covariate-dichotomous"]' },
    ContinuousAddButton: { css: 'button[class="submit-button"]' },
    DichoAddButton: { css: 'button[class="submit-button GWASUI-btnEnable GWASUI-dichBtn"]' },
    SelectSecondRadioInput: '(//input[@type="radio"])[2]',
    DichotomousCovariateValue1: '(//div[@class="ant-select select-cohort ant-select-single ant-select-show-arrow ant-select-show-search"])[1]',
    DichotomousCovariateValue2: '(//div[@class="ant-select select-cohort ant-select-single ant-select-show-arrow ant-select-show-search"])[2]',
    RenderedEulerDiagram: '//div[@id="euler"]//*[name()="svg"]',
    PhenotypeName: '//input[@id="phenotype-input"]',
    //from step4
    ConfigureGWAS: '//div[@class="configure-gwas_container"]',
    NoOfPC: '//input[@id="input-numOfPCs"]',
    AncestryDropDown: '//*[contains(@class,"ant-select ant-select-single ant-select-show-arrow ant-select-show-search")]',
    // ancestry: 'non-Hispanic Black',
    ancestry: '//div[@title="non-Hispanic Black"]',
    // last step
    SubmitDialogBox: '//div[@role="dialog"]',
    EnterJobName: '//input[@class="ant-input gwas-job-name"]',
    JobSubmitButton: '//span[normalize-space()="Submit"]',
    JobStatusButton: '//button[@id="see-status"]',
    SubmissionSuccessMessage: '//div[@class="dismissable-message success"]',
    SeeStatusButton: '//button[@id="see-status"]',
    SubmissionSuccessMessage: '//div[@class="dismissable-message success"]',
    //unauthorized
    UnauthorizedSpinner: '//span[@class="ant-spin-dot ant-spin-dot-spin"]',
};