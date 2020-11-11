/* eslint-disable codeceptjs/no-skipped-tests */
Feature('Study Viewer');

const { expect } = require('chai');
const { checkPod, getAccessToken } =  require('../../utils/apiUtil.js');
const { Bash } = require('../../utils/bash.js');
const studyViewerTasks = require('../../services/portal/studyViewer/studyViewerTasks.js');
const studyViewerProps = require('../../services/portal/studyViewer/studyViewerProps.js');

// User does not log in and has no access. User see 'Login to Request access' button
Scenario('User logs in and requests the access @studyViewer', async (I, home, users, login) => {
//     /*
//     1. Go to the Study Viewer Page
//     2. Select the dataset that is needed for research
//     3. if the user is not logged in, show button `Login to Request Access` and redirect to the login page
//     4. if the user is logged in, click on 'Request Access' button to acquire access to download
//     5. User will receive request_id from 'Request Access Queue'
//     6. User3 (who has Requestor access) makes a manual call to Requestor to validate the 'request_id' received
//     7. Go back to the page and user will have access to 'Download' button
//     8. Click on 'Download' button to download the file from indexd
//     */
// //     studyViewer.do.goToStudyPage();
// //     console.log('checking if the Requestor pod is up ...');
// //     await checkPod('requestor');
// //
// //     //check if the user is logged in
// //     if (login.ask.seeUserLoggedIn(users.mainAcct.username)){
// //         // sees the Request Access button and clicks it
// //         await studyViewer.do.clickRequestAccess();
// //     } else {
// //         // the user is not logged in
// //         await studyViewer.do.loginToRequestAccess();
// //         login.ask.isCurrentPage();
// //         home.complete.login(users.mainAcct);
// //         studyViewer.do.goToStudyPage()
// //         await studyViewer.do.clickRequestAccess();
// //         console.log("REQUEST SEND")
// //     }
// //     console.log("sending access request to the requestor");
// //     // get request_id from the URL
// //     await studyViewer.do.getRequestIDFromUrl(users);
// //
   home.do.goToHomepage();
   login.complete.login(users.mainAcct);
   studyViewerTasks.goToStudyPage();
   await studyViewerTasks.clickRequestAccess();
   //request id from requestor db
   await studyViewerTasks.putRequest();
   // I.refreshPage();
   // I.wait(5);
   // await studyViewerTasks.clickDownload();
   await studyViewerTasks.deleteRequest();
   // home.complete.logout();
   // await
   },
);

// // Tested and Passed
// // User doesnot login and want to request access
// Scenario('User doesnot login and requests the access', async(I, users, login) => {
//     studyViewerTasks.goToStudyPage();
//     await studyViewerTasks.loginToRequestAccess();
//     login.ask.isCurrentPage();
//     login.complete.login(users.mainAcct);
//     studyViewerTasks.goToStudyPage();
//     await I.waitForElement(studyViewerProps.requestAccessButtonXPath, 5);
//     },
// );


// // Tested and Passed
// /* user with access and can download the dataset*/
// Scenario('User2 has access to download @studyViewer', async (I, home, users, login) => {
//     home.do.goToHomepage();
//     login.complete.login(users.mainAcct);
//     studyViewerTasks.goToStudyPage();
//     // does not pass as the user doesnt have access to download the dataset
//     // await studyViewer.clickDownload();
//     },
// );

// Tested and Passed
// Scenario('Navigation to the detailed dataset page', async (I, home, users, login) => {
//     home.do.goToHomepage();
//     login.complete.login(users.mainAcct);
//     studyViewerTasks.goToStudyViewerPage();
//     await studyViewerTasks.learnMoreButton();
//   },
// );

// /* Setup after the test*/
After(async (home)=> {
    home.complete.logout();
    //TBC - delete the access for the mainAcct user from arborist and requestor db
});
