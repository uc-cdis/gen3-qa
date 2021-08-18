/*
Study Viewer integration tests
This test has pre-requisities:
1. studyViewerConfig to <envs>/portal/gitops.json
2. studyViewer link under the `button` section
        {
          "icon": "query",
          "link": "/study-viewer/clinical_trials",
          "color": "#a2a2a2",
          "name": "Study Viewer"
        }
3. set useArboristUI to true
4. add `jenkins_cmc_alias` inside manifest.json guppyConfig block
5. in manifest.json global block, add "tier_access_level": "libre"
6. add requestor service to the manifest.json block
*/

Feature('Study Viewer');

const { expect } = require('chai');
const { Bash } = require('../../utils/bash.js');
const studyViewerTasks = require('../../services/portal/studyViewer/studyViewerTasks.js');
const studyViewerProps = require('../../services/portal/studyViewer/studyViewerProps.js');
const requestorTasks = require('../../services/apis/requestor/requestorTasks.js');
const { sleepMS } = require('../../utils/apiUtil.js');

const bash = new Bash();

// I need a beforeSuite block to run ETL
BeforeSuite(async ({ I, users }) => {
  // mutate guppy config to point guppy at jenkins cmc permanent index
  await bash.runCommand('gen3 mutate-guppy-config-for-study-viewer-test');

  await sleepMS(30000);
  // polling logic to capture new indicess
  const nAttempts = 24;
  let guppyStatusCheckResp = '';
  for (let i = 0; i < nAttempts; i += 1) {
    console.log(`waiting for the new guppy pod with the expected jenkins cmc permanent index - Attempt #${i}...`);
    guppyStatusCheckResp = await I.sendGetRequest(
      `https://${process.env.NAMESPACE}.planx-pla.net/guppy/_status`,
      users.mainAcct.accessTokenHeader,
    );
    // `jenkins_cmc_permanent_alias` is always pointing to `jenkins_cmc_alias_213`
    if (guppyStatusCheckResp.status === 200
      && (Object.prototype.hasOwnProperty.call(guppyStatusCheckResp.data.indices, 'jenkins_cmc_alias_213'))) {
      console.log(`${new Date()}: all good, proceed with the test...`);
      break;
    } else {
      console.log(`${new Date()}: The expected jenkins cmc permanent index did not show up on guppy's status payload yet...`);
      await sleepMS(5000);
      if (i === nAttempts - 1) {
        const errMsg = `${new Date()}: The new guppy pod never came up with the expected indices: Details: ${guppyStatusCheckResp.data}`;
        console.log(errMsg);
        console.log(`err: ${guppyStatusCheckResp.data}`);
        // getting guppy pos logs 
        const guppyPodLogs = await bash.runCommand('g3kubectl logs -l app=guppy');
        console.log(`###### ##### ### DEBUGGING new guppy pod not coming up ok: ${guppyPodLogs}`);
        const checkGuppyConfig = await bash.runCommand('g3kubectl get cm manifest-guppy -o yaml');
        console.log(`###### ##### ### DEBUGGING manifest-guppy: ${checkGuppyConfig}`);
        throw new Error(`ERROR: ${errMsg}`);
      }
    }
  }
  // wait for guppy pods to be up which points towards jenkins_cmc_permanent index
  await sleepMS(30000);
});

// revokes your arborist access
AfterSuite(async () => {
  console.log('### revoking arborist access');
  // for qa-niaid testing to revoke the arborist access
  // programs.NIAID.projects.ACTT_reader */
  // if running in jenkins use this policy -> programs.jnkns.projects.jenkins_reader
  if (process.env.NAMESPACE.includes('qa-niaid') || process.env.NAMESPACE.includes('accessclinicaldata')) {
    console.log('### revoking access for user0 in QA/PROD envs ...');
    await bash.runCommand(`
      gen3 devterm curl -X DELETE arborist-service/user/dcf-integration-test-0@planx-pla.net/policy/programs.NIAID.projects.ACTT_reader
    `);
  } else {
    console.log('### revoking access for user0 in jenkins env ...');
    await bash.runCommand(`
      gen3 devterm curl -X DELETE arborist-service/user/dcf-integration-test-0@planx-pla.net/policy/programs.jnkns.projects.jenkins_reader
    `);
  }
  console.log('### The access is revoked');
});

// User does not log in and has no access. User see 'Login to Request access' button
Scenario('User doesnot login and requests the access @studyViewer', async ({
  I, users, login,
}) => {
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
  if (process.env.NAMESPACE.includes('qa-niaid') || process.env.NAMESPACE.includes('accessclinicaldata')) {
    console.log('### The test is running in qa-niaid env, now clicking the Download Button ...');
    await studyViewerTasks.clickDownload();
  } else {
    console.log('### The test is running in Jenkins Environment');
    console.log('### Checking the request status in requestor ...');
    const reqStatus = await requestorTasks.getRequestStatus(requestID);
    expect(
      reqStatus,
      'Check the requestor logs',
    ).to.equal('SIGNED');
  }
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
  if (process.env.NAMESPACE.includes('qa-niaid') || process.env.NAMESPACE.includes('accessclinicaldata')) {
    console.log('### The test is running in qa-niaid env, now clicking the Download Button ...');
    await studyViewerTasks.clickDownload();
  } else {
    console.log('### The test is running in Jenkins Environment');
    console.log('### The auxAcct1 has download privileges in user.yaml');
  }
});

// checking the details of the dataset
Scenario('Navigation to the detailed dataset page @studyViewer', async ({
  home, users, login,
}) => {
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
  if (process.env.NAMESPACE.includes('qa-niaid') || process.env.NAMESPACE.includes('accessclinicaldata')) {
    I.saveScreenshot('multipleDataset.png');
    await studyViewerTasks.multipleStudyViewer();
  } else {
    console.log('### This environment contains only one dataset for testing');
  }
});
