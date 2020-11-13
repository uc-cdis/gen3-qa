Feature('Study Viewer');

const studyViewerTasks = require('../../services/portal/studyViewer/studyViewerTasks.js');
const studyViewerProps = require('../../services/portal/studyViewer/studyViewerProps.js');

/* Setup after the test*/
After(async (home)=> {
   home.complete.logout();
   //TBC - delete the access for the mainAcct user from arborist and requestor db
});

// User does not log in and has no access. User see 'Login to Request access' button
Scenario('User logs in and requests the access @studyViewer', async (I, home, users, login) => {
   home.do.goToHomepage();
   login.complete.login(users.mainAcct);
   studyViewerTasks.goToStudyPage();
   await studyViewerTasks.clickRequestAccess();
   //request id from requestor db
   await studyViewerTasks.getRequestId();
   await studyViewerTasks.putRequest();
   I.refreshPage();
   I.wait(5);
   // await studyViewerTasks.clickDownload();
   await studyViewerTasks.deleteRequest();
   },
);

// User doesnot login and want to request access
Scenario('User doesnot login and requests the access', async(I, users, login) => {
    studyViewerTasks.goToStudyPage();
    await studyViewerTasks.loginToRequestAccess();
    login.ask.isCurrentPage();
    login.complete.login(users.mainAcct);
    studyViewerTasks.goToStudyPage();
    await I.waitForElement(studyViewerProps.requestAccessButtonXPath, 5);
    },
);

Scenario('Navigation to the detailed dataset page', async (I, home, users, login) => {
    home.do.goToHomepage();
    login.complete.login(users.mainAcct);
    studyViewerTasks.goToStudyViewerPage();
    await studyViewerTasks.learnMoreButton();
  },
);

// For download feature
// /* user with access and can download the dataset*/
// Scenario('User2 has access to download @studyViewer', async (I, home, users, login) => {
//     home.do.goToHomepage();
//     login.complete.login(users.mainAcct);
//     studyViewerTasks.goToStudyPage();
//     // does not pass as the user doesnt have access to download the dataset
//     await studyViewer.clickDownload();
//     },
// );

