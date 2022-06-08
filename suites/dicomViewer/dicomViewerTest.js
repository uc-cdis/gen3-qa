Feature('Dicom Viewer @requires-dicom-viewer @requires-dicom-server @requires-portal');

const fs = require("fs");
const chai = require('chai');
const { inJenkins } = require('../../utils/commons.js');

const { expect } = chai;
const { Bash } = require('../../utils/bash.js');

const bash = new Bash();
const { smartWait } = require('../../utils/apiUtil');

async function waitForETL() {
  const isComplete = async function () {
    const res = await bash.runCommand(`kc get pods | grep etl`);
    if (process.env.DEBUG === 'true') {
      console.log('############');
      console.log(res);
    }
    let complete = false;
    try {
      complete = res.includes('Completed');
    } catch (err) {
      console.error(`Unable to parse output. Error: ${err}. Output:`);
      console.error(res);
    }
    if (!complete) {
      console.log(`etl not complete`);
      return false;
    }
    return true;
  };

  console.log('Waiting for etl to complete');
  const timeout = 420; // wait up to 7 min
  await smartWait(
    isComplete,
    [],
    timeout,
    `etl not complete after ${timeout} seconds`, // error message
    2, // initial number of seconds to wait
  );
}


// Submit a dicom file and run etl
BeforeSuite(async ({ I }) => {
  // read dicom file
  filePath = "./testFile.dcm";
  if (!fs.existsSync(filePath)) {
    const msg = `Did not find test dicom file`;
    if (inJenkins) {
      throw Error(msg);
    }
  }
  const content = fs.readFileSync(filePath);

  // submit dicom file to dicom server
  URL = `https://${process.env.HOSTNAME}/dicom-server/instances/`;
  const res_server = await I.sendPostRequest(URL, content,
    {
      'Content-Type': 'application/dicom',
      Authorization: `bearer ${users.mainAcct.accessToken}`,
    });
  console.log(res_server);
  expect(res_server.status).to.equal(200);
  const dicomId = res_server.data.ID;
  
  // sumbit the file to the graph
  const program;
  const project;
  const modality;
  const submitData;
  if (process.env.RUNNING_LOCAL === 'true' && process.env.NAMESPACE.includes('qa-midrc')){
    program = "DEV";
    project = "DICOM_test";
    modality = "AAA"
    submitData = `{
      "type": "imaging_study",
      "cases": [
        {
          "id": "1265e15f-d867-42d5-8533-6bce6e97bb4d",
          "submitter_id": "case1"
        }
      ],
      "study_modality": "${modality}",
      "submitter_id": "${dicomId}"`
  }
  else{
    program = "jnkns";
    project = "jenkins";
    // TODO: find case id in jenkins
  }
  const endpoint = `/api/v0/submission/${program}/${project}/`;
  const res_node = await I.sendPutRequest(
    endpoint,
    submitData,
    user.mainAcct.accessTokenHeader,
  );
  console.log(res_node);
  expect(res_node.status).to.equal(200);
  I.cache.modality = modality;
  
  //run etl
  bash.runCommand('gen3 job run etl');
  await waitForETL();
});

Scenario('check uploaded dicom file @dicomViewer',
  async ({ I, home, users }) => {
    await home.do.login(users.mainAcct.username);
    I.amOnPage('/explorer');
    I.click('//h3[contains(text(), "Imaging Studies")]');
    I.click(`//span[contains(text(), "${I.cache.modality}")]/preceding-sibling::input'`)
    I.click('//button[@class="explorer-table-link-button"]');
    I.see('//*[@class="cornerstone-canvas"]');
  });
