Feature('Study Viewer');

const { Bash } = require('../../utils/bash.js');
const studyViewerTasks = require('../../services/portal/studyViewer/studyViewerTasks.js');
const studyViewerProps = require('../../services/portal/studyViewer/studyViewerProps.js');
const requestorTasks = require('../../services/apis/requestor/requestorTasks.js');

const bash = new Bash();

// logout after each test
// After(async ({ home }) => {
//   home.complete.logout();
// });

// I need a beforeSuite block to run ETL

// revokes your arborist access
AfterSuite(async () => {
  console.log('### revoking arborist access');
  await bash.runCommand(`
        gen3 devterm curl -X DELETE arborist-service/user/cdis.autotest@gmail.com/policy/programs.NIAID.projects.ACTT_reader
    `);
  console.log('### The access is revoked');
});

// User does not log in and has no access. User see 'Login to Request access' button
Scenario('User doesnot login and requests the access @studyViewer', async ({ I, users, login }) => {
  studyViewerTasks.goToStudyPage();
  await studyViewerTasks.loginToRequestAccess();
  login.ask.isCurrentPage();
  login.complete.login(users.mainAcct);
  studyViewerTasks.goToStudyPage();
  await I.waitForElement(studyViewerProps.requestAccessButtonXPath, 5);
});

// The User logs in the commons and requests access
// The request is APPROVED and then the request is SIGNED
Scenario('User logs in and requests the access @studyViewer', async ({
  I, home, users, login,
}) => {
  home.do.goToHomepage();
  login.complete.login(users.mainAcct);
  studyViewerTasks.goToStudyPage();
  await studyViewerTasks.clickRequestAccess();
  // request id from requestor db
  const requestID = await requestorTasks.getRequestId();
  await requestorTasks.approvedStatus(requestID);
  I.refreshPage();
  I.wait(5);
  await I.waitForElement(studyViewerProps.disabledButton);
  await requestorTasks.signedRequest(requestID);
  I.refreshPage();
  I.wait(5);
  await studyViewerTasks.clickDownload();
  await requestorTasks.deleteRequest(requestID);
});

// For download feature
/* user with access and can download the dataset */
Scenario('User has access to download @studyViewer', async ({
  home, users, login,
}) => {
  home.do.goToHomepage();
  // auxAcct1 has access granted in user.yaml
  login.complete.login(users.auxAcct1);
  studyViewerTasks.goToStudyPage();
  await studyViewerTasks.clickDownload();
});

// checking the details of the dataset
Scenario('Navigation to the detailed dataset page @studyViewer', async ({ home, users, login }) => {
  home.do.goToHomepage();
  login.complete.login(users.mainAcct);
  studyViewerTasks.goToStudyViewerPage();
  await studyViewerTasks.learnMoreButton();
});

//test multiple datasets
Scenario('Multiple dataset @studyViewer', async ({home, users, login}) => {
  home.do.goToHomepage();
  login.complete.login(users.mainAcct);
  studyViewerTasks.goToStudyViewerPage();
  await studyViewerTasks.multipleStudyViewer();
});
