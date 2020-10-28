/* eslint-disable codeceptjs/no-skipped-tests */
Feature('Study Viewer');

const { expect } = require('chai');
const { checkPod, getAccessToken } =  require('../../utils/apiUtil.js');
const { Bash } = require('../../utils/bash.js');

const bash = new Bash();
Before((home) => {
    home.do.goToHomepage();
});

// // User does not log in and has no access. User see 'Login to Request access' button
// Scenario('User1 does not log in, has no access and requests access @studyViewer', async (I, home, users, studyViewer, login) => {
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
//     studyViewer.do.goToStudyPage();
//     console.log('checking if the Requestor pod is up ...');
//     await checkPod('requestor');
//
//     //check if the user is logged in
//     if (login.ask.seeUserLoggedIn(users.mainAcct.username)){
//         // sees the Request Access button and clicks it
//         await studyViewer.do.clickRequestAccess();
//     } else {
//         // the user is not logged in
//         await studyViewer.do.loginToRequestAccess();
//         login.ask.isCurrentPage();
//         home.complete.login(users.mainAcct);
//         studyViewer.do.goToStudyPage()
//         await studyViewer.do.clickRequestAccess();
//         console.log("REQUEST SEND")
//     }
//     console.log("sending access request to the requestor");
//     // get request_id from the URL
//     await studyViewer.do.getRequestIDFromUrl(users);
//
// }).retry(2);
//
// // User logs in and no access. User sees 'Request Access' button
// // Scenario('User2 logs in, has no access and requests access @studyviewer', async(I, home, users,studyViewer) => {
// //     home.do.goToHomepage();
// //     home.complete.login(users.mainAcct);
// //     studyViewer.do.goToStudyViewerPage();
// //     await checkPod('requestor');
// //
// //
// //
// // }).retry(2);
//
// // /* user with access and can download the dataset*/
// // Scenario('User2 has access to download @studyViewer', async (I, home, users, studyViewer) => {
// //     /*
// //               1. Go to the Study Viewer Page
// //               2. Select the dataset that is needed for research
// //               3. Click on 'Download' button to download the file from indexd
// //       */
// //     home.do.goToHomepage();
// //     home.complete.login(users.mainAcct);
// //     studyViewer.do.goToStudyViewerPage();
// //     I.waitForElement({css: '.study-viewer'});
// //     I.click({ xpath: 'xpath: //button[contains(text(), \'Download\')]'});
// // }).retry(2);

Scenario('Navigation to the detailed dataset page @manual', async (I, home, users, studyViewer) => {
          //
          //     1. Go to the Study Viewer Page
          //     2. Select the dataset that is needed for research
          //     3. Click on 'Learn More' button
          //     4. Navigates the user to the detailed page of the dataset that is selected
          //     5. User should be able to see 'Download' or 'Request Access' button depending on the access user has
    home.do.goToHomepage();
    home.complete.login(users.mainAcct);
    studyViewer.do.goToStudyViewerPage();
    await studyViewer.do.learnMoreButton();
  },
);

/* Setup after the test*/
After(async (home)=> {
    home.complete.logout();
    //delete the access for the mainAcct user from arborist and requestor db
});
