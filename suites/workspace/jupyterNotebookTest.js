/*
 Jupyter Notebook test (PXP-????)
 This test plan has a few pre-requisites:
 1. The environment must have the file-upload capabilities
    (Ssjdispatcher should be configured)
 2. The environment must be configured with Hatchery (To run workspace applications)
*/
Feature('Jupyter Notebook');

const { expect } = require('chai');
const { checkPod, sleepMS } = require('../../utils/apiUtil.js');
const { Bash } = require('../../utils/bash.js');

const bash = new Bash();

// TODO: If we utilize the sheepdog module here
// the framework expects the testData folder and the DataImportOrderPath.txt to exist
// We need to replace that findDeleteAllNodes with a bash.runJob(removetestdata)
// call (to be implemented).
// BeforeSuite(async ({ I, indexd, sheepdog }) => {

BeforeSuite(async ({ I }) => {
  console.log('Preparing environment for the test scenarios...');

  I.cache = {};

  const JOB_NAME = process.env.JOB_NAME || 'CDIS_GitHub_Org/myrepo';
  const BRANCH_NAME = process.env.BRANCH_NAME || 'PR-1234';

  let repoName = JOB_NAME.split('/')[1];
  repoName = repoName.toLowerCase();
  const prNumber = BRANCH_NAME.split('-')[1];

  console.log(`${new Date()}: repoName: ${repoName}`);
  console.log(`${new Date()}: prNumber: ${prNumber}`);

  I.cache.repoName = repoName;
  I.cache.prNumber = prNumber;

  // Restore original etl-mapping and manifest-guppy configmaps (for idempotency)
  console.log('Running kube-setup-guppy to restore any configmaps that have been mutated. This can take a couple of mins...');
  await bash.runCommand('gen3 kube-setup-guppy');

  /*
  // clean up all indexd records
  console.log('deleting all files / indexd records...');
  const listOfIndexdRecords = await I.sendGetRequest(
    `${indexd.props.endpoints.get}`,
  );

  listOfIndexdRecords.data.records.forEach(async ( record ) => {
    console.log(`deleting indexd record: ${record.did}...`);
    await indexd.do.deleteFile({ did: record.did });
  });

  // clean up any leftover nodes if any
  console.log('deleting sheepdog entries / clinical data...');
  await sheepdog.complete.findDeleteAllNodes();
  */
});

Scenario('Submit dummy data to the Gen3 Commons environment @jupyterNb', async ({ I, users }) => {
  // generate dummy data
  bash.runJob('gentestdata', 'SUBMISSION_USER cdis.autotest@gmail.com MAX_EXAMPLES 1');
  await checkPod(I, 'gentestdata', 'gen3job,job-name=gentestdata');

  const queryRecentlySubmittedData = {
    query: '{ submitted_unaligned_reads (first: 20, project_id: "DEV-test", quick_search: "", order_by_desc: "updated_datetime") {id, type, submitter_id} }',
    variables: null,
  };
  // query the data to confirm its successfull submission
  const queryResponse = await I.sendPostRequest(
    '/api/v0/submission/graphql',
    queryRecentlySubmittedData,
    users.mainAcct.accessTokenHeader,
  );

  // make sure the query return results
  console.log(`query response: ${JSON.stringify(queryResponse.data)}`);
  expect(queryResponse).to.have.property('status', 200);
});

Scenario('Upload a file through the gen3-client CLI @jupyterNb', async ({
  I, fence, users,
}) => {
  // Download the latest linux binary from https://github.com/uc-cdis/cdis-data-client/releases

  // if RUNNING_LOCAL=true, this will run inside the admin vm (vpn connection required)
  await bash.runCommand('curl -L https://github.com/uc-cdis/cdis-data-client/releases/latest/download/dataclient_linux.zip -o gen3-client.zip');
  await bash.runCommand('unzip -o gen3-client.zip');
  const gen3ClientVersionOutput = await bash.runCommand('./gen3-client --version');
  console.log(`gen3-client version: ${gen3ClientVersionOutput}`);

  // obtain an api_key
  const scope = ['data', 'user'];
  const apiKeyRes = await fence.do.createAPIKey(
    scope,
    users.mainAcct.accessTokenHeader,
  );
  const data = {
    api_key: apiKeyRes.data.api_key,
    key_id: apiKeyRes.data.key_id,
  };

  const credsPath = `./${process.env.NAMESPACE}_creds.json`;
  // if RUNNING_LOCAL=true, this will create the file inside the admin vm
  const stringifiedData = JSON.stringify(data).replace(/"/g, '\\"');
  await bash.runCommand(`echo "${stringifiedData}" > ${credsPath}`);

  // create client profile
  await bash.runCommand(`./gen3-client configure --profile=${process.env.NAMESPACE} --cred=${credsPath} --apiendpoint=https://${process.env.NAMESPACE}.planx-pla.net`);

  const ourFileToBeUploaded = `hello_${Date.now()}.txt`;

  const dummyFileContents = 'Hello world!';
  await bash.runCommand(`echo "${dummyFileContents}" > ./${ourFileToBeUploaded}`);

  // upload the file
  const uploadOutput = await bash.runCommand(`./gen3-client upload --profile=${process.env.NAMESPACE} --upload-path=./${ourFileToBeUploaded} 2>&1`);

  console.log(`### ## uploadOutput: ${uploadOutput}`);

  const regexToFindGUID = /.*GUID(.*)\..*$/;
  const theGUID = regexToFindGUID.exec(uploadOutput)[1].replace(' ', '');

  // Cache the guid
  I.cache.theGUID = theGUID;

  await checkPod(I, 'indexing', 'ssjdispatcherjob');

  // TODO: Query GUID to confirm the indexd record was created succeessfully
  const indexdLookupResponse = await I.sendGetRequest(`https://${process.env.NAMESPACE}.planx-pla.net/index/${theGUID}`);

  expect(indexdLookupResponse).to.have.property('status', 200);
  expect(indexdLookupResponse.data).to.have.property('file_name', ourFileToBeUploaded);
  expect(indexdLookupResponse.data.acl).to.eql([]);
  expect(indexdLookupResponse.data.authz).to.eql([]);
}).retry(2);

Scenario('Map the uploaded file to one of the subjects of the dummy dataset @jupyterNb', async ({ I, login, users }) => {
  login.do.goToLoginPage();
  I.saveScreenshot('loginPage.png');
  login.complete.login(users.mainAcct);

  // Go to submission page
  I.amOnPage('/submission');
  I.amOnPage('/submission/files');

  // Unmapped files sometimes show up in "Generating... " state.
  // Need to wait a few seconds
  // eslint-disable-next-line no-undef
  const checkboxIsClickable = await tryTo(() => I.waitForClickable(`//input[@id='${I.cache.theGUID}]'`, 30));
  I.saveScreenshot('ClickCheckboxOfUnmappedFile.png');
  if (!checkboxIsClickable) {
    // if the checkbox is still not clickable,refresh the page
    I.refreshPage();
    I.wait(1);
    I.saveScreenshot('ClickCheckboxOfUnmappedFileAfterRefresh.png');
  }
  // Click checkbox with id of the guid of the uploadedfile
  I.click(`//input[@id='${I.cache.theGUID}']`);
  console.log('Start to map file');

  I.click('Map Files (1)');
  I.waitForVisible('.map-data-model__form', 5);

  // Select Project
  I.fillField('//input[@id=\'react-select-2-input\']', 'DEV-test');
  I.pressKey('Enter');
  console.log('Project selected');

  // Select File Node
  I.fillField('//input[@id=\'react-select-3-input\']', 'submitted_unaligned_reads');
  I.pressKey('Enter');
  console.log('File Node selected');
  I.waitForText('Required Fields');

  // Select required fields and core_metadata_collection
  const FIELDS_INDEX_START = 4;
  const FIELDS_INDEX_END = 8;
  for (let i = FIELDS_INDEX_START; i <= FIELDS_INDEX_END; i += 1) {
    I.click(`//input[@id='react-select-${i}-input']`);
    // Select the 1st option
    I.pressKey('Enter');
  }
  I.waitForVisible('//button[contains(text(),\'Submit\')]', 5);
  console.log('Required Fileds selected, core_metadata_collection selected');

  // Click submit button
  I.click('//button[contains(text(),\'Submit\')]');

  I.wait(1);
  I.saveScreenshot('checkUploadedFileIsMapped.png');
  I.seeElement('//p[text()="1 files mapped successfully!"]');
  // TODO: check if file number in DEV-test project was increased by one
});

Scenario('Mutate etl-mapping config and run ETL to create new indices in elastic search @jupyterNb', async ({ I }) => {
  console.log('### mutate the etl-mapping k8s config map');

  await bash.runCommand(`gen3 mutate-etl-mapping-config ${I.cache.prNumber} ${I.cache.repoName}`);

  console.log('### running ETL for recently-submitted dataset');
  await bash.runJob('etl', '', false);
  await checkPod(I, 'etl', 'gen3job,job-name=etl', { nAttempts: 80, ignoreFailure: false, keepSessionAlive: true });
  await sleepMS(10000);
});

Scenario('Mutate manifest-guppy config and roll guppy so the recently-submitted dataset will be available on the Explorer page @jupyterNb', async ({ I, users }) => {
  console.log('### mutate the manifest-guppy k8s config map');

  await bash.runCommand(`gen3 mutate-guppy-config ${I.cache.prNumber} ${I.cache.repoName}`);
  await bash.runCommand('gen3 roll guppy');

  // Wait a few seconds for the new guppy pod to come up, otherwise it will not pick up the newly-created indices
  console.log('waiting for a new guppy pod...');
  await sleepMS(30000);

  // start polling logic to capture new es indices
  const nAttempts = 24; // 2 minutes and then we give up :(

  let guppyStatusCheckResp = "";
  for (let i = 0; i < nAttempts; i += 1) {
    console.log(`waiting for the new guppy pod with the new indices - Attempt #${i}...`);
    guppyStatusCheckResp = await I.sendGetRequest(
      `https://${process.env.NAMESPACE}.planx-pla.net/guppy/_status`,
      users.mainAcct.accessTokenHeader,
    );

    if (guppyStatusCheckResp.status === 200 &&
      (guppyStatusCheckResp.data.indices.hasOwnProperty(`${I.cache.prNumber}.${I.cache.repoName}.${process.env.NAMESPACE}_etl`) ||
      guppyStatusCheckResp.data.indices.hasOwnProperty(`${I.cache.prNumber}.${I.cache.repoName}.${process.env.NAMESPACE}_subject`) ||
      guppyStatusCheckResp.data.indices.hasOwnProperty(`${I.cache.prNumber}.${I.cache.repoName}.${process.env.NAMESPACE}_file`))) {
      console.log(`${new Date()}: all good, proceed with the assertions...`);
      break;
    } else {
      console.log(`${new Date()}: The new indices did not show up on guppy's status payload yet...`);
      await sleepMS(5000);
      if (i === nAttempts - 1) {
        console.log(`${new Date()}: The new guppy pod never came up with the new indices: Details: ${guppyStatusCheckResp.data}`)
        throw err;
      }
    }
  }

  expect(guppyStatusCheckResp).to.have.property('status', 200);
  expect(guppyStatusCheckResp.data).to.have.property('statusCode', 200);
  expect(guppyStatusCheckResp.data.indices).to.have.any.keys(
    `${I.cache.prNumber}.${I.cache.repoName}.${process.env.NAMESPACE}_subject`,
    `${I.cache.prNumber}.${I.cache.repoName}.${process.env.NAMESPACE}_etl`,
    `${I.cache.prNumber}.${I.cache.repoName}.${process.env.NAMESPACE}_file`,
  );
});

Scenario('Login and check if the Explorer page renders successfully @jupyterNb', async ({ I, login, users }) => {
  login.do.goToLoginPage();
  I.saveScreenshot('loginPage.png');
  login.complete.login(users.mainAcct);
  I.wait(5);
  I.saveScreenshot('before_checking_navbar.png');
  const navBarButtons = await I.grabTextFromAll({ xpath: 'xpath: //nav[@class=\'nav-bar__nav--items\']//div/a/descendant-or-self::*' });

  if (navBarButtons.includes('Exploration')) {
    I.amOnPage('/explorer');
    console.log('### I am on Exploration Page');
    // exploration Page
    I.wait(5);
    I.saveScreenshot('explorationPage.png');
    I.seeElement('.guppy-explorer', 10);
    // checks if the Filters are present on the left side of Exploration Page
    I.seeElement('//h4[contains(text(),\'Filters\')]', 5);

    // checks if the `Export to Workspace` button is disabled on the page
    const expToWorkspaceBtExists = await tryTo(() => I.seeElement({ xpath: '//button[contains(text(),\'Export to Workspace\')]' })); // eslint-disable-line no-undef
    if (!expToWorkspaceBtExists) {
      console.log('### The `Export to Workspace` is disabled on the "Data" tab. Let us switch to the "File" tab...');
      // clicks the File tab on the exploration page
      I.click('//h3[contains(text(),\'File\')]');
      I.waitForVisible('//button[contains(text(),\'Export to Workspace\')]', 10);
      I.saveScreenshot('fileTab.png');
    } else {
      console.log('### The `Export to Workspace` is enabled on the "Data" tab. Just click on it!');
      I.waitForVisible('//button[contains(text(),\'Export to Workspace\')]', 10);
    }
  } else if (navBarButtons.includes('Files')) {
    I.amOnPage('/files');
    console.log('### I am on Files Page');
    // Files Page
    I.wait(5);
    I.saveScreenshot('filesPage.png');
    I.seeElement('.guppy-explorer', 10);
    // Exploration page filters
    // if this doesnt work use this -> //body/div[@id='root']/div[1]/div[1]/div[3]/div[1]/div[1]/div[3]/div[1]/div[2]
    I.seeElement('//h4[contains(text(),\'Filters\')]', 5);
    I.waitForVisible('//button[contains(text(),\'Export to Workspace\')]', 10);
  } else {
    I.saveScreenshot('whatTheHellIsGoingOnWithTheNavBar.png');
    console.log('WARN: This environment does not have any Explorer or Files button on the navigation bar. This test should not run here');
  }
});

/*
  Let us stop here for now and introduce this test to the CI Pipeline
*/

Scenario('Select a cohort that contains the recently-mapped file and export it to the workspace @jupyterNb', async ({ I }) => {
  I.amOnPage('/explorer');
  I.wait(5);
  I.saveScreenshot('explorationPageAgain.png');
  // TODO
  // console.log('We did it!');
});

Scenario('Open the workspace, launch a Jupyter Notebook Bio Python app and load the exported manifest with some Python code @jupyterNb', async () => {
  // TODO
});