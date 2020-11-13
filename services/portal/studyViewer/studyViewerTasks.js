const studyViewerProps =  require('./studyViewerProps.js');
const users = require("../../../utils/user");
const stringify = require('json-stringify-safe');

const I = actor();

module.exports = {

    goToStudyViewerPage() {
        I.amOnPage(studyViewerProps.path); ///study-viewer/clinical_trials
        I.waitForVisible(studyViewerProps.studyViewerDivClass, 5); //.study-viewer
        I.saveScreenshot(`study_viewer_page.png`);
    },

    goToStudyPage() {
        // /study-viewer/clinical_trials/ACTT
        I.amOnPage(studyViewerProps.datasetPath);
        I.waitForVisible(studyViewerProps.datasetDivClass, 5);
        I.saveScreenshot('dataset_page.png');
    },

    async clickRequestAccess() {
        await I.seeElement(studyViewerProps.requestAccessButtonXPath);
        I.click(studyViewerProps.requestAccessButtonXPath);
    },

    async loginToRequestAccess() {
        await I.seeElement(studyViewerProps.loginRAButtonXPath);
        I.click(studyViewerProps.loginRAButtonXPath);
    },

    async clickDownload() {
        await I.seeElement(studyViewerProps.downloadButtonXPath);
        I.click(studyViewerProps.downloadButtonXPath);
    },

    async learnMoreButton() {
        await I.seeElement(studyViewerProps.detailedButtonXPath);
        I.click(studyViewerProps.detailedButtonXPath);
        await I.seeElement(studyViewerProps.activeDivClass);
        I.saveScreenshot('.png');
        await I.seeElement(studyViewerProps.learnMoreButtonXPath);
        I.click(studyViewerProps.learnMoreButtonXPath);
        await I.seeElement(studyViewerProps.studyViewerDivClass);
    },

    async getRequestId() {
        const getResponse = await I.sendGetRequest(
            `${studyViewerProps.endpoint.userEndPoint}`,
            users.mainAcct.accessTokenHeader,
        );
        const responseData = getResponse.data;
        const req_id = responseData[0].request_id;
        console.log(`### request id: ${req_id}`);
        return req_id;
    },

    async putRequest() {
        let req_id_put = await this.getRequestId();
        console.log(`### put request id: ${req_id_put}`);
        //sending PUT request /requestor/request/${req_id} endpoint
        await I.sendPutRequest(
            `${studyViewerProps.endpoint.requestEndPoint}/${req_id_put}`,
            { "status": "APPROVED" },
            users.mainAcct.accessTokenHeader,
        );
    },

    async deleteRequest() {
        let req_id_del = await this.getRequestId();
        console.log(`### delete request id: ${req_id_del}`);
        await I.sendDeleteRequest(
            `${studyViewerProps.endpoint.requestEndPoint}/${req_id_del}`,
            users.mainAcct.accessTokenHeader,
        );
    }
};

