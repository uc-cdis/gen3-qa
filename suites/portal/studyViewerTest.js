Feature('Study Viewer');

const { Bash } = require('../../utils/bash.js');
const studyViewerTasks = require('../../services/portal/studyViewer/studyViewerTasks.js');
const studyViewerProps = require('../../services/portal/studyViewer/studyViewerProps.js');
const requestorTasks = require('../../services/portal/studyViewer/requestorTasks.js');

const bash = new Bash();

AfterSuite(async({I}) => {
    // gen3 devterm curl -X DELETE arborist-service/user/cdis.autotest@gmail.com/policy/programs.NIAID.projects.ACTT_reader
    // TBC - delete the access for the mainAcct user from arborist and requestor db
    console.log('### revoking arborist access');
    await bash.runCommand(`
        gen3 devterm curl -X DELETE arborist-service/user/cdis.autotest@gmail.com/policy/programs.NIAID.projects.ACTT_reader
    `);
    console.log('### The access is revoked');
});

// // The User logs in the commons and requests access
Scenario('User doesnot login and requests the access', async ({I, users, login}) => {
    studyViewerTasks.goToStudyPage();
    await studyViewerTasks.loginToRequestAccess();
    login.ask.isCurrentPage();
    login.complete.login(users.mainAcct);
    studyViewerTasks.goToStudyPage();
    await I.waitForElement(studyViewerProps.requestAccessButtonXPath, 5);
});

// User does not log in and has no access. User see 'Login to Request access' button
Scenario('User logs in and requests the access @studyViewer', async ({I, home, users, login}) => {
    home.do.goToHomepage();
    login.complete.login(users.mainAcct);
    studyViewerTasks.goToStudyPage();
    await studyViewerTasks.clickRequestAccess();
    // request id from requestor db
    const requestID = await requestorTasks.getRequestId();
    await requestorTasks.putRequest(requestID);
    I.refreshPage();
    I.wait(5);
    await studyViewerTasks.clickDownload();
    await requestorTasks.deleteRequest(requestID);
    home.complete.logout();
});

// For download feature
/* user with access and can download the dataset*/
Scenario('User has access to download @studyViewer', async ({I, home, users, login}) => {
    home.do.goToHomepage();
    login.complete.login(users.mainAcct);
    studyViewerTasks.goToStudyPage();
    await studyViewerTasks.clickDownload();
    home.complete.logout();
});

Scenario('Navigation to the detailed dataset page', async ({I, home, users, login}) => {
    // home.do.goToHomepage();
    // login.complete.login(users.mainAcct);
    studyViewerTasks.goToStudyViewerPage();
    await studyViewerTasks.learnMoreButton();
});


