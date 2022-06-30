Feature('Dicom Viewer @requires-dicom-viewer @requires-dicom-server @requires-portal');

const fs = require('fs');
const chai = require('chai');
const { inJenkins } = require('../../utils/commons.js');

const { expect } = chai;
const { Bash } = require('../../utils/bash.js');

const bash = new Bash();

// Submit a dicom file and run etl
BeforeSuite(async ({
  I, users, sheepdog, peregrine,
}) => {
  I.cache = {};

  // read dicom file
  const filePath = 'files/testFile.dcm';
  if (!fs.existsSync(filePath)) {
    const msg = 'Did not find test dicom file';
    if (inJenkins) {
      throw Error(msg);
    }
  }
  const content = fs.readFileSync(filePath);

  // submit dicom file to dicom server
  const URL = `https://${process.env.HOSTNAME}/dicom-server/instances/`;
  const resServer = await I.sendPostRequest(URL, content,
    {
      'Content-Type': 'application/dicom',
      Authorization: `bearer ${users.mainAcct.accessToken}`,
    });
  console.log(resServer);
  expect(resServer.status).to.equal(200);
  const studyInstance = resServer.data.ParentStudy;
  const resStudy = await I.sendGetRequest(`https://${process.env.HOSTNAME}/dicom-server/studies/${studyInstance}`, users.mainAcct.accessTokenHeader);
  const studyId = resStudy.data.MainDicomTags.StudyInstanceUID;
  I.cache.studyId = studyId;
  // sumbit the file to the graph
  let program = '';
  let project = '';
  let caseid = '';
  let casesubmitterid = '';
  if (process.env.RUNNING_LOCAL === 'true' && process.env.NAMESPACE.includes('qa-midrc')) {
    program = 'DEV';
    project = 'DICOM_test';
    caseid = '1265e15f-d867-42d5-8533-6bce6e97bb4d';
    casesubmitterid = 'case1';
  } else {
    program = 'jnkns';
    project = 'jenkins';

    // generate example data and run etl
    await sheepdog.do.runGenTestData(1);
    await bash.runJob('etl');

    // run query to get case id
    const querystring = '{ case (first: 1, project_id: "jnkns-jenkins") {id, submitter_id}}';
    const resCase = await peregrine.do.query(querystring, null);
    caseid = resCase.data.case[0].id;
    casesubmitterid = resCase.data.case[0].submitter_id;
  }
  const submitData = `{
    "type": "imaging_study",
    "cases": [
      {
        "id": "${caseid}",
        "submitter_id": "${casesubmitterid}"
      }
    ],
    "submitter_id": "${studyId}"
  }`;
  const endpoint = `https://${process.env.HOSTNAME}/api/v0/submission/${program}/${project}/`;
  const resNode = await I.sendPutRequest(
    endpoint,
    submitData,
    users.mainAcct.accessTokenHeader,
  );
  console.log(resNode);
  expect(resNode.status).to.equal(200);

  // run etl
  await bash.runJob('etl');
});

Scenario('check uploaded dicom file @dicomViewer',
  async ({ I, home, users }) => {
    await home.do.login(users.mainAcct.username);
    I.amOnPage('/explorer');
    I.click('//h3[contains(text(), "Imaging Studies")]');
    I.saveScreenshot('dicom_viewer_exploration_page.png');
    const studyLink = `https://${process.env.HOSTNAME}/dicom-viewer/viewer/${I.cache.studyId}`;
    I.click(`//a[@href="${studyLink}"]//button[@class="explorer-table-link-button"]`);
    I.wait(2);
    I.saveScreenshot('dicom_viewer_study_page.png');
    I.see('//*[@class="cornerstone-canvas"]');
  });
