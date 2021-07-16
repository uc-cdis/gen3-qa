/*
 PFB Export Test (PXP-????)
 This test plan has a few pre-requisites:
 1. The environment must have the file-upload capabilities
    (Ssjdispatcher should be configured)
 2. The environment must be configured with sower-jobs (To run pelican-export)
*/
Feature('PFB Export');

const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
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

  console.log('deleting temp .avro files...');
  await bash.runCommand(`find . -name "test_export_*" -exec rm {} \\\; -exec echo "deleted {}" \\\;`); // eslint-disable-line quotes,no-useless-escape
});

AfterSuite(async () => {
  console.log('Reverting artifacts back to their original state...');

  // Restore original etl-mapping and manifest-guppy configmaps (for idempotency)
  console.log('Running kube-setup-guppy to restore any configmaps that have been mutated. This can take a couple of mins...');
  await bash.runCommand('gen3 kube-setup-guppy');
});

Scenario('Submit dummy data to the Gen3 Commons environment @pfbExport', async ({ I, users }) => {
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

Scenario('Upload a file through the gen3-client CLI @pfbExport', async ({
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
});

Scenario('Map the uploaded file to one of the subjects of the dummy dataset @pfbExport', async ({ I, login, users }) => {
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
  I.waitForText('Required Fields', 10);

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

Scenario('Mutate etl-mapping config and run ETL to create new indices in elastic search @pfbExport', async ({ I }) => {
  console.log('### mutate the etl-mapping k8s config map');

  await bash.runCommand(`gen3 mutate-etl-mapping-config ${I.cache.prNumber} ${I.cache.repoName}`);

  console.log('### running ETL for recently-submitted dataset');
  await bash.runJob('etl', '', false);
  await checkPod(I, 'etl', 'gen3job,job-name=etl', { nAttempts: 80, ignoreFailure: false, keepSessionAlive: true });
  await sleepMS(10000);
});

Scenario('Mutate manifest-guppy config and roll guppy so the recently-submitted dataset will be available on the Explorer page @pfbExport', async ({ I, users }) => {
  console.log('### mutate the manifest-guppy k8s config map');

  await bash.runCommand(`gen3 mutate-guppy-config-for-pfb-export-test ${I.cache.prNumber} ${I.cache.repoName}`);
  await bash.runCommand('gen3 roll guppy');

  // Wait a few seconds for the new guppy pod to come up
  // otherwise it will not pick up the newly-created indices
  console.log('waiting for a new guppy pod...');
  await sleepMS(30000);

  // start polling logic to capture new es indices
  const nAttempts = 24; // 2 minutes and then we give up :(

  let guppyStatusCheckResp = '';
  for (let i = 0; i < nAttempts; i += 1) {
    console.log(`waiting for the new guppy pod with the new indices - Attempt #${i}...`);
    guppyStatusCheckResp = await I.sendGetRequest(
      `https://${process.env.NAMESPACE}.planx-pla.net/guppy/_status`,
      users.mainAcct.accessTokenHeader,
    );

    if (guppyStatusCheckResp.status === 200
      && (Object.prototype.hasOwnProperty.call(guppyStatusCheckResp.data.indices, `${I.cache.prNumber}.${I.cache.repoName}.${process.env.NAMESPACE}_etl`)
      || Object.prototype.hasOwnProperty.call(guppyStatusCheckResp.data.indices, `${I.cache.prNumber}.${I.cache.repoName}.${process.env.NAMESPACE}_subject`)
      || Object.prototype.hasOwnProperty.call(guppyStatusCheckResp.data.indices, `${I.cache.prNumber}.${I.cache.repoName}.${process.env.NAMESPACE}_file`))) {
      console.log(`${new Date()}: all good, proceed with the assertions...`);
      break;
    } else {
      console.log(`${new Date()}: The new indices did not show up on guppy's status payload yet...`);
      await sleepMS(5000);
      if (i === nAttempts - 1) {
        console.log(`${new Date()}: The new guppy pod never came up with the new indices: Details: ${guppyStatusCheckResp.data}`);
        console.log(`err: ${guppyStatusCheckResp.data}`);
      }
    }
  }

  expect(guppyStatusCheckResp).to.have.property('status', 200);
  expect(guppyStatusCheckResp.data).to.have.property('statusCode', 200);
  // expect(guppyStatusCheckResp.data.indices).to.have.any.keys(
  //  `${I.cache.prNumber}.${I.cache.repoName}.${process.env.NAMESPACE}_subject`,
  //  `${I.cache.prNumber}.${I.cache.repoName}.${process.env.NAMESPACE}_etl`,
  //  `${I.cache.prNumber}.${I.cache.repoName}.${process.env.NAMESPACE}_file`,
  // );
});

Scenario('Visit the Explorer page, select a cohort, export to PFB and download the .avro file @pfbExport', async ({
  I, login, users,
}) => {
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

    // TODO: Select random cohorts to try different PFBs

    // checks if the `Export to PFB` button is disabled on the page
    const expToWorkspaceBtExists = await tryTo(() => I.seeElement({ xpath: '//button[contains(text(),\'Export to PFB\')]' })); // eslint-disable-line no-undef
    if (!expToWorkspaceBtExists) {
      console.log('### The `Export to PFB` is disabled on the "Data" tab. Let us switch to the "File" tab...');
      // clicks the File tab on the exploration page
      I.click('//h3[contains(text(),\'File\')]');
      I.waitForVisible('//button[contains(text(),\'Export to PFB\')]', 10);
      I.saveScreenshot('fileTab.png');
    } else {
      console.log('### The `Export to PFB` is enabled on the "Data" tab. Just click on it!');
      I.waitForVisible('//button[contains(text(),\'Export to PFB\')]', 10);
    }
  } else if (navBarButtons.includes('Files')) {
    I.amOnPage('/files');
    console.log('### I am on Files Page');
    // Files Page
    I.wait(5);
    I.saveScreenshot('filesPage.png');
    I.seeElement('.guppy-explorer', 10);
    // Exploration page filters
    I.seeElement('//h4[contains(text(),\'Filters\')]', 5);
    I.waitForVisible('//button[contains(text(),\'Export to PFB\')]', 10);
  } else {
    I.saveScreenshot('whatTheHellIsGoingOnWithTheNavBar.png');
    console.log('WARN: This environment does not have any Explorer or Files button on the navigation bar. This test should not run here');
  }

  // Click on the Export to PFB button
  I.click('//button[contains(text(),\'Export to PFB\')]');

  // Check if the footer shows expected msg
  I.seeElement({ xpath: '//div[@class=\'explorer-button-group__toaster-text\']/div[contains(.,\'Please do not navigate away from this page until your export is finished.\')]' }, 10);

  // check if the pelican-export pod (sower job) runs successfully
  await checkPod(I, 'pelican-export', 'sowerjob', { nAttempts: 80, ignoreFailure: false, keepSessionAlive: false });
  await sleepMS(5000);

  // check if the footer is updated with the download link
  // and fetch the PreSigned URL to download the PFB file
  const pfbDownloadURL = await I.grabAttributeFrom({
    xpath: '//div[@class=\'explorer-button-group__toaster-text\']/a[contains(.,\'Click here to download your PFB.\')]',
  }, 'href');

  // get unique id for this test
  I.cache.UNIQUE_NUM = Date.now();

  // fetch the contents of the PFB file
  const pfbDownloadURLResp = await axios({
    url: pfbDownloadURL,
    method: 'get',
    responseType: 'arraybuffer',
    headers: { Accept: 'binary/octet-stream' },
  });
  // I.say(util.inspect(pfbDownloadURLResp, { depth: null }));
  try {
    console.log(`Writing test_export_${I.cache.UNIQUE_NUM}.avro file to ${process.cwd()} folder...`);
    fs.writeFileSync(path.join(process.cwd(), `./test_export_${I.cache.UNIQUE_NUM}.avro`), pfbDownloadURLResp.data);
  } catch (e) {
    throw new Error(e);
  }
  if (process.env.RUNNING_LOCAL) {
    const scpArgs = [`test_export_${I.cache.UNIQUE_NUM}.avro`, `${process.env.NAMESPACE}@cdistest.csoc:/home/${process.env.NAMESPACE}/test_export_${I.cache.UNIQUE_NUM}.avro`];
    console.log('SCPing avro file to admin vm...');
    const scpCmd = spawnSync('scp', scpArgs, { stdio: 'pipe' });
    console.log(`${new Date()}: scp output => ${scpCmd.output.toString()}`);
  }
});

Scenario('Install the latest pypfb CLI version and make sure we can parse the avro file @pfbExport', async ({ I }) => {
  // TODO: [python3 -m pip install pypfb --user] is NOT pulling the latest one
  // It always downloads the 0.5.0 instead :/
  // that is because 0.5.0 has the follow py version criteria = Requires: Python >=3.6, <4.0
  // whereas 0.5.14 = Requires: Python >=3.6.1, <3.8
  const pyPfbInstallationOutput = await bash.runCommand('python3 -m venv pfb_test && source pfb_test/bin/activate && pip install pypfb && ${process.env.WORKSPACE}/gen3-qa/pfb_test/bin/pfb');
  console.log(`${new Date()}: pyPfbInstallationOutput = ${pyPfbInstallationOutput}`);

  // await bash.runCommand(`cat ./test_export_${I.cache.UNIQUE_NUM}.avro`);
  const pfbParsingResult = await bash.runCommand(`source pfb_test/bin/activate && ${process.env.WORKSPACE}/gen3-qa/pfb_test/bin/pfb show -i ./test_export_${I.cache.UNIQUE_NUM}.avro | jq .`);
  // console.log(`${new Date()}: pfbParsingResult = ${pfbParsingResult}`);
  const pfbConvertedToJSON = JSON.parse(`[${pfbParsingResult.replace(/\}\{/g, '},{')}]`);
  // console.log(`${new Date()}: pfbConvertedToJSON = ${JSON.stringify(pfbConvertedToJSON)}`);

  // assertions
  // make sure the parsed PFB follows the expected Clinical Data Model hierarchy traversal path
  // (program -> project -> study)
  const ddNodesSet = new Set();
  for (const node in pfbConvertedToJSON) { // eslint-disable-line guard-for-in
    // console.log(`node name: ${pfbConvertedToJSON[node].name}`);
    await ddNodesSet.add(pfbConvertedToJSON[node].name);
  }
  const itDDNodesSet = ddNodesSet.values();
  expect(itDDNodesSet.next().value).to.equal('program');
  expect(itDDNodesSet.next().value).to.equal('project');
  expect(itDDNodesSet.next().value).to.equal('study');

  // TODO: Refine cohort later and make sure the selected projects show up in the PFB file
});
