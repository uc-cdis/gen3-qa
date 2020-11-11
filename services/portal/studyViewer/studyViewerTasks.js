const studyViewerProps =  require('./studyViewerProps.js');
const users = require("../../../utils/user");
const stringify = require('json-stringify-safe');

const I = actor();
let req_id;

module.exports = {

    goToStudyViewerPage() {
        I.amOnPage(studyViewerProps.path); ///study-viewer/clinical_trials
        I.waitForVisible(studyViewerProps.studyViewerDivClass, 5); //.study-viewer
    },

    goToStudyPage() {
        I.amOnPage(studyViewerProps.datasetPath);
        I.waitForVisible(studyViewerProps.datasetDivClass, 5);
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
        await I.seeElement(studyViewerProps.learnMoreButtonXPath);
        I.click(studyViewerProps.learnMoreButtonXPath);
        await I.seeElement(studyViewerProps.studyViewerDivClass);
    },

    async getRequestId() {
        const getResponse = await I.sendGetRequest(
            `${studyViewerProps.endpoint.userEndPoint}`,
            users.mainAcct.accessTokenHeader,
        );
        console.log('#####the response Data:', stringify(getResponse.data));
        const responseData = getResponse.data;
        req_id = responseData[0].request_id;
        console.log(`### request id: ${req_id}`);
        return req_id;
    },

    async putRequest() {
        req_id_put = this.getRequestId();
        console.log(`### request id: ${req_id_put}`);
        //sending PUT request /requestor/request/${req_id} endpoint
        await I.sendPutRequest(
            `${studyViewerProps.endpoint.requestEndPoint}/${req_id_put}`,
            { "status": "APPROVED" },
            users.mainAcct.accessTokenHeader,
        );
    },

    // async deleteRequest() {
    //     const req_id_del = this.getRequestId();
    //     await I.sendDeleteRequest(
    //         `${studyViewerProps.endpoint.requestEndPoint}/${req_id_del}`,
    //         users.mainAcct.accessTokenHeader,
    //     );
    // }
};

