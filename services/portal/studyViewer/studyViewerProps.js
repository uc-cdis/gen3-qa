/**
*Explorer Page Property
*/

const userEndPoint = '/requestor/request/user';
const requestEndPoint = '/requestor/request';

module.exports = {
    endpoint: {
        userEndPoint,
        requestEndPoint,
    },
    path: '/study-viewer/clinical_trials',
    datasetPath: '/study-viewer/clinical_trials/ACTT',

    studyViewerDivClass: '.study-viewer',
    datasetDivClass: '.study-viewer__title',
    detailedButtonXPath: '.ant-collapse-header',

    learnMoreButtonXPath: '//button[contains(text(), \'Learn More\')]',
    loginRAButtonXPath: '//button[contains(text(), \'Login to Request Access\')]',
    requestAccessButtonXPath: '//button[contains(text(), \'Request Access\')]',
    downloadButtonXPath: '//button[contains(text(), \'Download\')]',

    inactiveDivClass: '.ant-collapse-content-inactive',
    activeDivClass: '.ant-collapse-content-active',
};

