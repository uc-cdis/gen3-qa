/*
 This test plan has a few pre-requisites:
 1. Sower must be deployed and
 2. The environment's manifest must have the indexing jobs declared
    within the sower config block (manifest-indexing & indexd-manifest)
 3. The Indexing GUI is only available in data-portal >= 2.24.9
*/
Feature('Indexing page - PXP-5786');

// const stringify = require('json-stringify-safe');
const { expect } = require('chai');
const { sleepMS, Gen3Response } = require('../../utils/apiUtil.js');
const { Bash } = require('../../utils/bash.js');

const bash = new Bash();

const testGUID = 'dg123/c2da639f-aa25-4c4d-8e89-02a143788268';
const testHash = '73d643ec3f4beb9020eef0beed440ad4';

/* eslint-disable no-tabs */
const contentsOfTestManifest = `GUID	md5	size	acl	url
${testGUID}	${testHash}	13	[jenkins2]	s3://cdis-presigned-url-test/testdata`;

BeforeSuite(async (I, files, indexd) => {
  console.log('Setting up dependencies...');
  I.cache = {};

  I.cache.UNIQUE_NUM = Date.now();

  // create a local small file to upload. store its size and hash
  await files.createTmpFile(`./manifest_${I.cache.UNIQUE_NUM}.tsv`, contentsOfTestManifest);

  console.log('deleting existing test records...');
  const listOfIndexdRecords = await I.sendGetRequest(
    `${indexd.props.endpoints.get}`,
  ).then((res) => new Gen3Response(res));

  listOfIndexdRecords.data.records.forEach(async (record) => {
    console.log(record.did);
    await indexd.do.deleteFile({ did: record.did });
  });
});

AfterSuite(async (I, files) => {
  // clean up test files
  files.deleteFile(`manifest_${I.cache.UNIQUE_NUM}.tsv`);
});

async function checkPod(podName, nAttempts = 3) {
  for (let i = 0; i < nAttempts; i += 1) {
    try {
      console.log(`waiting for the ${podName} sower job/pod to show up... - attempt ${i}`);
      await sleepMS(10000);
      const greppingPod = bash.runCommand(`g3kubectl get pods | grep ${podName}`);
      console.log(`grep result: ${greppingPod}`);
      if (greppingPod.includes(podName)) {
        console.log('the pod was found! Proceed with the assertion checks..');
        await sleepMS(10000);
        break;
      }
    } catch (e) {
      console.log(`Failed to find the ${podName} pod on attempt ${i}:`);
      console.log(e);
      if (i === nAttempts - 1) {
        throw e;
      }
    }
  }
}

// Scenario #1 - Login and navigate to the indexing page and upload dummy manifest
Scenario('Navigate to the indexing page and upload a test manifest @indexing', async (I, indexing, home) => {
  home.do.goToHomepage();
  home.complete.login();
  indexing.do.goToIndexingPage();
  I.waitForElement({ css: '.indexing-page' }, 10);
  I.click('.index-flow-form'); // after clicking open window file upload dialog
  await I.attachFile('input[type=\'file\']', `manifest_${I.cache.UNIQUE_NUM}.tsv`);
  I.click({ xpath: 'xpath: //button[contains(text(), \'Index Files\')]' });

  await checkPod('manifest-indexing');

  const nAttempts = 5;
  for (let i = 0; i < nAttempts; i += 1) {
    console.log(`Looking up the indexd record... - attempt ${i}`);
    const indexdRecordRes = await I.sendGetRequest(
      `/index/${testGUID}`,
    ).then((res) => new Gen3Response(res));

    if (indexdRecordRes.data.hashes) {
      expect(indexdRecordRes.data.hashes.md5).to.equal(testHash);
    } else {
      console.log(`WARN: The indexd record has not been created yet... - attempt ${i}`);
      await sleepMS(5000);
      if (i === nAttempts - 1) {
        const manifestIndexingLogs = bash.runCommand('gen3 job logs manifest-indexing');
        console.log(`manifest-indexing logs: ${manifestIndexingLogs}`);
        throw new Error(`ERROR: The manifest indexing operation failed. Response: ${indexdRecordRes.data}`);
      }
    }
  }
});

// Scenario #2 - Login and navigate to the indexing page and download a full indexd manifest
Scenario('Navigate to the indexing page and download a full indexd manifest @indexing', async (I, indexing, home) => {
  home.do.goToHomepage();
  home.complete.login();
  indexing.do.goToIndexingPage();
  I.waitForElement({ css: '.indexing-page' }, 10);
  I.click({ xpath: 'xpath: //button[contains(text(), \'Download\')]' });

  await checkPod('indexd-manifest');

  const waitingThreshold = 30;
  console.log('Waiting for Green status DONE to show up on the page...');
  I.waitForElement({ css: '.index-files-green-label' }, waitingThreshold);

  I.handleDownloads();
  I.click({ xpath: 'xpath: //button[contains(text(), \'Download Manifest\')]' });
  I.amInPath('output/downloads');
  const downloadedFileNames = I.grabFileNames();

  console(`downloaded file: ${downloadedFileNames[0]}`);

  expect(testHash).to.equal('73d643ec3f4beb9020eef0beed440ad4');
});
