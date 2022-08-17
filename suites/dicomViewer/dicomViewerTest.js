Feature('Dicom Viewer @requires-dicom-viewer @requires-dicom-server @requires-portal @requires-guppy');

/**
   * Note: this test only works for MIDRC because it needs case and imaging_study nodes
   * exist and are linked, also it needs a imaging studies tab in the explorer
*/

const fs = require('fs');
const chai = require('chai');

const { expect } = chai;
const { Bash } = require('../../utils/bash.js');

const bash = new Bash();

async function submitDicomFile(I, accessToken) {
  // read dicom file
  const filePath = 'files/testFile.dcm';
  if (!fs.existsSync(filePath)) {
    const msg = 'Did not find test dicom file';
    throw Error(msg);
  }
  const content = fs.readFileSync(filePath);

  // submit dicom file to dicom server
  const URL = `https://${process.env.HOSTNAME}/dicom-server/instances/`;
  const resServer = await I.sendPostRequest(URL, content,
    {
      'Content-Type': 'application/dicom',
      Authorization: `bearer ${accessToken}`,
    });
  console.log(resServer);
  return resServer;
}

// Submit a dicom file and run etl before testing
BeforeSuite(async ({
  I, users, sheepdog, peregrine,
}) => {
  I.cache = {};

  // submit dicom file to dicom server
  const resServer = await submitDicomFile(I, users.mainAcct.accessToken);
  expect(resServer.status).to.equal(200);
  I.cache.fileID = resServer.data.ID;
  const studyInstance = resServer.data.ParentStudy;
  const resStudy = await I.sendGetRequest(`https://${process.env.HOSTNAME}/dicom-server/studies/${studyInstance}`, users.mainAcct.accessTokenHeader);
  expect(resStudy.status).to.equal(200);
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
    I.wait(1);
    I.saveScreenshot('dicom_viewer_exploration_page.png');
    const studyLink = `https://${process.env.HOSTNAME}/dicom-viewer/viewer/${I.cache.studyId}`;
    I.click(`//a[@href="${studyLink}"]//button[@class="explorer-table-link-button"]`);
    I.wait(3);
    I.switchToNextTab();
    I.saveScreenshot('dicom_viewer_study_page.png');
    I.seeCurrentUrlEquals(studyLink);
    I.seeElement('//*[@class="cornerstone-canvas"]');
  });

Scenario('unauthorized user cannot POST dicom file @dicomViewer',
  async ({ I, users }) => {
    const resServer = await submitDicomFile(I, users.auxAcct1.accessToken);
    console.log(resServer);
    expect(resServer.status).to.not.equal(200);
  });

Scenario('unauthorized user cannot GET dicom file @dicomViewer',
  async ({ I, users }) => {
    const resInstanceUnauthorize = await I.sendGetRequest(`https://${process.env.HOSTNAME}/dicom-server/instances/${I.cache.fileID}`, users.auxAcct1.accessTokenHeader);
    console.log(resInstanceUnauthorize);
    expect(resInstanceUnauthorize.status).to.not.equal(200);
  });

Scenario('unauthorized user cannot GET non-exist dicom file @dicomViewer',
  async ({ I, users }) => {
    const nonExistId = '538a3dfd-219a25e0-8443a0b7-d1f512a6-2348ff25';
    const resNonExistInstance = await I.sendGetRequest(`https://${process.env.HOSTNAME}/dicom-server/instances/${nonExistId}`, users.mainAcct.accessTokenHeader);
    console.log(resNonExistInstance);
    expect(resNonExistInstance.status).to.not.equal(200);
  });
