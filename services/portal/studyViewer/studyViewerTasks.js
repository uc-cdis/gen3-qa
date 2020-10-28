const studyViewerProps =  require('./studyViewerProps.js');

const I = actor();

module.exports = {
    goToStudyViewerPage() {
        I.amOnPage(studyViewerProps.path);
        I.waitForVisible(studyViewerProps.studyViewerDivClass);
    },

    goToStudyPage() {
        I.amOnPage(studyViewerProps.datasetPath);
        I.waitForVisible(studyViewerProps.datasetDivClass);
    },

    async clickRequestAccess() {
        await I.seeElement(studyViewerProps.requestAccessButtonXPath);
        I.click(studyViewerProps.requestAccessButtonXPath);
    },

    async loginToRequestAccess() {
        await I.seeElement(studyViewerProps.loginRAButtonXPath);
        I.click(studyViewerProps.loginRAButtonXPath);
        I.goToLoginPage();
    },

    async learnMoreButton() {
        await I.see(studyViewerProps.studiesDivClass);
        I.click(studyViewerProps.studiesDivClass);
        await I.seeElement(studyViewerProps.activeDivClass);
        await I.seeElement(studyViewerProps.learnMoreButtonXPath);
        I.click(studyViewerProps.learnMoreButtonXPath);
        await I.seeElement(studyViewerProps.studyViewerDivClass);
    },

    async getRequestIDFromUrl(users) {
        const urlParams = new URLSearchParams(window.location.search);
        // check if request id is present in the url
        if (urlParams.has('request_id') === true){
            const requestID = urlParams.get('request_id');
            console.log(requestID);
            const url = 'https://${process.env.HOSTNAME}/requestor/request/${requestID}';
            // sends a PUT request to the requestor endpoint to update the request
            I.sendPutRequest(url, { "status": "APPROVED" }, ${users.mainAcct.getAccessTokenHeader});
        } else{
            // stop the test if there is no request id in the url
            console.log("No Request ID in URL");
            throw new Error('Stop the Test! the request ID is not present in the URL');
        }
    }



}

