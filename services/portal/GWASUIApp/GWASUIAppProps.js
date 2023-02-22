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
    CohortTableTitle: '//th[contains(text(),"Cohort Name")]',
    ContinuousPhenotypeButton: '//span[contains(text(),"Add Continuous Outcome Phenotype")]',
    DichotomousPhenotypeButton: '//span[contains(text(),"Add Dichotomous Outcome Phenotype")]',
    AttritionTableExpandArrow: '//div[@class="ant-collapse-expand-icon"]',
    ActiveAttritionTable: '//div[@data-tour="attrition-table"]',
    AttritionTableTitle: '//span[contains(text(),"Attrition Table")]',
    tablerow1: '//tbody/tr[1]',
    //from step2
    PhenotypeHistogram: '//span[contains(text(),"Attrition Table")]',
    RenderedContinuousHisto: '//div[@role="region"]//*[name()="svg"]',
    PhenotypeTable: '//div[@class="ant-table-container"]',
    PhenotypeSubmitButton: '//button[contains(text(),"Submit")]',
    SelectFirstRadioInput: '(//input[@class="ant-radio-input" and not(@disabled)])[1]',
    DichotomousPhenotypeValue1: '(//div[contains(@class,"ant-select-selector")])[1]',
    DichotomousPhenotypeValue2: '(//div[contains(@class,"ant-select-selector")])[2]',
    //for step3
    ContinuousCovariateButton: '//span[contains(text(),"Add Continuous CoCovariate")]',
    DichotomousCovariateButton: '//span[contains(text(),"Add Dichotomous CoCovariate")]',
    AddButton: '//button[contains(text(),"Add")]',
    SelectSecondRadioInput: '(//input[@type="radio"])[2]',
    DichotomousCovariateValue1: '(//div[@class="ant-select select-cohort ant-select-single ant-select-show-arrow ant-select-show-search"])[1]',
    DichotomousCovariateValue2: '(//div[@class="ant-select select-cohort ant-select-single ant-select-show-arrow ant-select-show-search"])[2]',
    RenderedEulerDiagram: '//div[@id="euler"]//*[name()="svg"]',
    PhenotypeName: '//input[@id="phenotype-input"]',
    //from step4
    ConfigureGWAS: '//div[@class="configure-gwas_container"]',
    NoOfPC: '//input[@id="input-numOfPCs"]',
    AncestryDropDown: '//*[contains(@class,"ant-select ant-select-single ant-select-show-arrow ant-select-show-search")]',
    ancestry: 'non-Hispanic Black',
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
