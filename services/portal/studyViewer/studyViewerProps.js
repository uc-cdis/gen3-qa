/**
*Explorer Page Property
*/
module.exports = {
    path: '/study-viewer/clinical_trials',
    datasetPath: '/study-viewer/clinical_trials/ACTT',

    studyViewerDivClass: '.study-viewer',
    datasetDivClass: '.study-viewer__title',
    studiesDivClass: '.ant-collapse-header',

    learnMoreButtonXPath: '//button[contains(text(), \'Learn More\')]',
    loginRAButtonXPath: '//button[contains(@class, "g3-button--primary") and contains(text(), \'Login to Request Access\')]',
    requestAccessButtonXPath: '//button[contains(@class, "g3-button--primary") and conatins(text(), \'Request Access\')]',

    inactiveDivClass: '.ant-collapse-content-inactive',
    activeDivClass: '.ant-collapse-content-active',
};
