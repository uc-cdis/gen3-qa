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
  // for qa-niaid testing to revoke the arborist access
  /* gen3 devterm curl -X DELETE arborist-service/user/dcf-integration-test-0@planx-pla.net/
  policy/programs.NIAID.projects.ACTT_reader */
  // if running in jenkins use this policy -> programs.jnkns.projects.jenkins_reader
  await bash.runCommand(`
     gen3 devterm curl -X DELETE arborist-service/user/dcf-integration-test-0@planx-pla.net/policy/programs.jnkns.projects.jenkins_reader
    `);
  console.log('### The access is revoked');
});

// User does not log in and has no access. User see 'Login to Request access' button
Scenario('User doesnot login and requests the access @studyViewer', async ({ I, users, login }) => {
  studyViewerTasks.goToStudyViewerPage();
  await studyViewerTasks.learnMoreButton();
  await studyViewerTasks.loginToRequestAccess();
  login.ask.isCurrentPage();
  I.wait(10);
  await I.saveScreenshot('login.png');
  login.complete.login(users.user0);
  studyViewerTasks.goToStudyViewerPage();
  await studyViewerTasks.learnMoreButton();
  await I.waitForElement(studyViewerProps.requestAccessButtonXPath, 10);
});

// The User logs in the commons and requests access
// The request is APPROVED and then the request is SIGNED
Scenario('User logs in and requests the access @studyViewer', async ({
  I, home, users, login,
}) => {
  home.do.goToHomepage();
  login.complete.login(users.user0);
  studyViewerTasks.goToStudyViewerPage();
  await studyViewerTasks.learnMoreButton();
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
  studyViewerTasks.goToStudyViewerPage();
  await studyViewerTasks.learnMoreButton();
  await studyViewerTasks.clickDownload();
});

// checking the details of the dataset
Scenario('Navigation to the detailed dataset page @studyViewer', async ({ home, users, login }) => {
  home.do.goToHomepage();
  login.complete.login(users.user0);
  studyViewerTasks.goToStudyViewerPage();
  await studyViewerTasks.learnMoreButton();
});

// test multiple datasets
Scenario('Multiple dataset @studyViewer', async ({
  I, home, users, login,
}) => {
  home.do.goToHomepage();
  login.complete.login(users.user0);
  studyViewerTasks.goToStudyViewerPage();
  // qa-niaid env is configured with two dataset,
  // but jenkins-niaid is configured with one dataset
  // so the check below will save the test from failing in jenkins
  if (process.env.testedEnv.includes('qa-niaid') || process.env.testedEnv.includes('accessclinicaldata')) {
    I.saveScreenshot('multipleDataset.png');
    await studyViewerTasks.multipleStudyViewer();
  } else {
    console.log('### This environment contains only one dataset for testing');
  }
});
