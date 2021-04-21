/*
 Jupyter Notebook test (PXP-????)
 This test plan has a few pre-requisites:
 1. The environment must have the file-upload capabilities
    (Ssjdispatcher should be configured)
 2. The environment must be configured with Hatchery (To run workspace applications)
*/
Feature('Jupyter Notebook');

const { expect } = require('chai');
const { checkPod, sleepMS, Gen3Response } = require('../../utils/apiUtil.js');
const { Bash } = require('../../utils/bash.js');

const bash = new Bash();

BeforeSuite(async ( I, indexd, sheepdog ) => {
  console.log('Preparing environment for the test scenarios...');
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

xScenario('Submit dummy data to the Gen3 Commons environment @jupyterNb', async (I, fence, users) => {
  // generate dummy data
  bash.runJob('gentestdata', args = "SUBMISSION_USER cdis.autotest@gmail.com");
  await checkPod('gentestdata', 'gen3job,job-name=gentestdata');

  const queryRecentlySubmittedData = {
    "query": "{ submitted_unaligned_reads (first: 20, project_id: \"DEV-test\", quick_search: \"\", order_by_desc: \"updated_datetime\") {id, type, submitter_id} }",
    "variables": null,
  };
  // query the data to confirm its successfull submission
  const queryResponse = await I.sendPostRequest(
    `/api/v0/submission/graphql`,
    queryRecentlySubmittedData,
    users.mainAcct.accessTokenHeader,
  );

  // make sure the query return results
  console.log(`query response: ${JSON.stringify(queryResponse.data)}`);
  expect(queryResponse).to.have.property('status', 200);
});

Scenario('Upload a file through the gen3-client CLI @jupyterNb', async (fence, users, files) => {
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
  await bash.runCommand(`echo "${JSON.stringify(data)}" > ${credsPath}`);

  // create client profile
  await bash.runCommand(`./gen3-client configure --profile=${process.env.NAMESPACE} --cred=${credsPath} --apiendpoint=https://${process.env.NAMESPACE}.planx-pla.net`);

  const dummyFileContents = 'Hello world!';
  await bash.runCommand(`echo "${dummyFileContents}" > ./hello.txt`);

  // upload the file
  const uploadOutput = await bash.runCommand(`./gen3-client upload --profile=${process.env.NAMESPACE} --upload-path=./hello.txt`);

  // TODO: Parse output to find GUID
  await checkPod('indexing', 'ssjdispatcherjob');

  // TODO: Query GUID to confirm the indexd record was created succeessfully
  //  e.g., const indexdLookupResponse = I.sendGetRequest(`https://qa-dcp.planx-pla.net/index/dg.ANV0/a0dd0a09-f1ee-47be-a268-1dd7ae26f5b7`);

  // expect(indexdLookupResponse).to.have.property('status', 200);
  // expect(indexdLookupResponse.data).to.have.property('file_name', 'hello.txt');
  // expect(indexdLookupResponse.data).to.have.property('acl', []);
  // expect(indexdLookupResponse.data).to.have.property('authz', []);
});

Scenario('Map the uploaded file to one of the subjects of the dummy dataset @jupyterNb', async ({ I }) => {
  // Go to submission page
  I.amOnPage('/submission');

  I.amOnPage('/submission/files');
  I.click('//input[@id=\'0\']');
  console.log('Start to map file');
  // TODO :Click checkbox with id of the guid of the uploadedfile
  // I.click(//input[@id=<guid>]);

  I.click('Map Files (1)');
  I.waitForVisible('.map-data-model__form', 5);

  // Select Project
  I.fillField('//input[@id=\'react-select-2-input\']', 'DEV-test');
  I.pressKey('Enter');
  I.seeNumberOfElements({ react: 'Fc' }, 1);
  console.log('Project selected');

  // Select File Node
  I.fillField('//input[@id=\'react-select-3-input\']', 'submitted_unaligned_reads');
  I.pressKey('Enter');
  I.seeNumberOfElements({ react: 'Fc' }, 2);
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

Scenario('Run ETL so the recently-submitted dataset will be available on the Explorer page @jupyterNb', async ({ I }) => {
  console.log('### running ETL for recently-submitted dataset');
  await bash.runJob('etl', '', false);
  await checkPod(I, 'etl','gen3job,job-name=etl', { nAttempts: 80, ignoreFailure: false, keepSessionAlive: true });
});

xScenario('Select a cohort that contains the recently-mapped file and export it to the workspace @jupyterNb', async (fence, users) => {
 // TODO
});

xScenario('Open the workspace, launch a Jupyter Notebook Bio Python app and load the exported manifest with some Python code @jupyterNb', async (fence, users) => {
 // TODO
});
