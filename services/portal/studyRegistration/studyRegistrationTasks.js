const studyRegistrationProps = require('./studyRegistrationProps.js');
const discoveryProps = require('../discovery/discoveryProps.js');
const requestorProps = require('../../apis/requestor/requestorProps.js');
const users = require('../../../utils/user');

const { expect } = require('chai');
const I = actor();

module.exports = {

    async readUnregisteredMetadata(accesstTokenheader, guid) {
        const resp = await I.sendGetRequest(`${studyRegistrationProps.registrationPath}/${guid}`, accesstTokenheader);
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

    fillRequestAccessForm(email) {
        I.amOnPage(studyRegistrationProps.requestPath);
        I.saveScreenshot('FormPage.png');
        I.seeElement(studyRegistrationProps.formPage);
        I.fillField(studyRegistrationProps.firstName, 'Test');
        I.fillField(studyRegistrationProps.lastName, 'User');
        I.fillField(studyRegistrationProps.emailAddress, email);
        I.fillField(studyRegistrationProps.institute, 'University of Chicago');
        I.click(studyRegistrationProps.roleRadioButton);
        I.saveScreenshot('registerPage.png');
        I.click(studyRegistrationProps.submitButton);
        I.wait(5);
        I.saveScreenshot('SuccessPage.png');
        I.seeElement(studyRegistrationProps.successMessage);
    },

    seeRegisterButton() {
        I.seeElement(studyRegistrationProps.registerStudyButton);
        I.click(studyRegistrationProps.registerStudyButton);
    },
    
    fillRegistrationForm(title, uuid) {
        I.amOnPage(studyRegistrationProps.registerPath);
        I.seeElement(studyRegistrationProps.registerForm);
        I.wait(20);
        I.fillField(studyRegistrationProps.cedarUUID, uuid);
        I.click(studyRegistrationProps.registerSubmitButton);
    },
}