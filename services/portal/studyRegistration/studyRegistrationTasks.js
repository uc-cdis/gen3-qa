const studyRegistrationProps = require('./studyRegistrationProps.js');
const discoveryProps = require('../discovery/discoveryProps.js');
const requestorProps = require('../../apis/requestor/requestorProps.js');

const { expect } = require('chai');
const I = actor();

module.exports = {

    async readMetadata(accessTokenHeader, guid) {
        const resp = await I.sendGetRequest(`${studyRegistrationProps.registrationPath}/${guid}`, accessTokenHeader);
        if (resp.status === 200) {
            return resp.data;
        }
    },

    async getRequestId(userToken) {
        const getResponse = await I.sendGetRequest(
          `${requestorProps.endpoint.userEndPoint}`,
          userToken,
        );
        const responseData = getResponse.data;
        expect(responseData).to.not.be.empty;
        const reqID = responseData[0].request_id;
        if (process.env.DEBUG === 'true') {
          console.log(`### request id: ${reqID}`);
        }
        return reqID;
    },

    searchStudy(id) {
        I.seeElement(studyRegistrationProps.searchBar);
        I.seeElement(studyRegistrationProps.studyTable);
        I.fillField(studyRegistrationProps.searchBar, id);
        I.wait(5);
        I.click(studyRegistrationProps.studyCheckBoxButton);
        I.wait(5);
        I.saveScreenshot('StudyPageDrawer.png');
        I.seeElement(studyRegistrationProps.studyDrawer);
        I.saveScreenshot('StudyPageDrawer1.png');    
    },
    
    // if using this function, add this to test
    // studyRegistrationTasks.goToStudyPermaLink(I.cache.applicationID);
    // goToStudyPermaLink(studyID) {
    //     studyLink = `${discoveryProps.path}/${studyID}`;
    //     I.amOnPage(studyLink);
    //     I.wait(10);
    //     I.saveScreenshot('StudyPage.png');
    //     I.seeElement(studyRegistrationProps.studyDrawer);
    //     I.seeElement(studyRegistrationProps.requestAccessButton);    
    // },

    fillRequestAccessForm(email, projectTitle) {
        I.amOnPage(studyRegistrationProps.requestPath);
        I.saveScreenshot('FormPage.png');
        I.seeElement(studyRegistrationProps.formPage);
        I.waitForValue(studyRegistrationProps.projectTitle, projectTitle, 5);
        I.fillField(studyRegistrationProps.firstName, 'Test');
        I.fillField(studyRegistrationProps.lastName, 'User');
        I.fillField(studyRegistrationProps.emailAddress, email);
        I.fillField(studyRegistrationProps.institute, 'University of Chicago');
        I.click(studyRegistrationProps.roleRadioButton);
        I.saveScreenshot('registerPage.png');
        I.scrollPageToBottom(studyRegistrationProps.formPage);
        I.saveScreenshot('scrollDownRegisterPage.png');
        I.wait(5);
        I.click(studyRegistrationProps.submitButton);
        I.wait(10);
        I.saveScreenshot('SuccessPage.png');
        // kayako is not set up in CI
        // I.seeElement(studyRegistrationProps.successMessage);
    },

    seeRegisterButton() {
        I.seeElement(studyRegistrationProps.registerStudyButton);
        I.click(studyRegistrationProps.registerStudyButton);
    },
    
    async fillRegistrationForm(uuid, studyName) {
        I.amOnPage(studyRegistrationProps.registerPath);
        I.seeElement(studyRegistrationProps.registerForm);
        const study =  await I.grabAttributeFrom(studyRegistrationProps.studyTitle, 'title');
        if (process.env.DEBUG === 'true') {
            console.log(`### StudyTitle Retrieved: ${study}`);
        }
        expect(study).to.be.equal(studyName);
        I.fillField(studyRegistrationProps.cedarUUID, uuid);
        I.saveScreenshot('registerCedarID.png');
        I.click(studyRegistrationProps.registerSubmitButton);
        I.wait(5);
        I.saveScreenshot('registerAfterSubmitButton.png');
    },
}
