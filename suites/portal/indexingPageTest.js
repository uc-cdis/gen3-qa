/*
 Indexing GUI & Indexing/Manifest Sower Jobs (PXP-5786)
 This test plan has a few pre-requisites:
 1. Sower must be deployed and
 2. The environment's manifest must have the indexing jobs declared
    within the sower config block (manifest-indexing & indexd-manifest)
 3. The Indexing GUI is only available in data-portal >= 2.24.9
*/
Feature('Indexing GUI @requires-portal @requires-sower @requires-ssjdispatcher @requires-fence');

const { expect } = require('chai');
const { checkPod, sleepMS } = require('../../utils/apiUtil.js');
const { Bash } = require('../../utils/bash.js');

const bash = new Bash();

const testGUID = 'dg123/c2da639f-aa25-4c4d-8e89-02a143788268';
const testHash = '73d643ec3f4beb9020eef0beed440ad4';

/* eslint-disable no-tabs */
const contentsOfTestManifest = `GUID	md5	size	acl	authz	urls
${testGUID}	${testHash}	13	jenkins2		s3://cdis-presigned-url-test/testdata`;

const contentsOfInvalidManifest1 = `\ufeffGUID	md5	size	acl	authz	urls
${testGUID}\n	${testHash}	13,	jenkins2		s3://cdis-presigned-url-test/testdata`;

const expectedResult = `${testGUID},s3://cdis-presigned-url-test/testdata,,jenkins2,${testHash},13,`;

BeforeSuite(async ({ I, files, indexd }) => {
  console.log('Setting up dependencies...');
  try {
    I.cache = {};

    I.cache.UNIQUE_NUM = Date.now();

    // create local small files to upload. store their size and hash
    await files.createTmpFile(`./manifest_${I.cache.UNIQUE_NUM}.tsv`, contentsOfTestManifest);
    await files.createTmpFile(`./invalid_manifest_${I.cache.UNIQUE_NUM}.tsv`, contentsOfInvalidManifest1);

    console.log('deleting existing test records...');
    const listOfIndexdRecords = await I.sendGetRequest(
      `${indexd.props.endpoints.get}`,
    );

    listOfIndexdRecords.data.records.forEach(async ({ record }) => {
      if (process.env.DEBUG === 'true') {
        console.log(record.did);
      }
      await indexd.do.deleteFile({ did: record.did });
    });
  } catch (error) {
    console.log(error);
  }
});

AfterSuite(async ({ I, files }) => {
  // clean up test files
  try {
    files.deleteFile(`manifest_${I.cache.UNIQUE_NUM}.tsv`);
    files.deleteFile(`invalid_manifest_${I.cache.UNIQUE_NUM}.tsv`);
  } catch (error) {
    console.log(error);
  }
});

// Scenario #1 - Login and navigate to the indexing page and upload dummy manifest
Scenario('Navigate to the indexing page and upload a test manifest @indexing', async ({
  I, indexing, home, users,
}) => {
  home.do.goToHomepage();
  await home.complete.login(users.indexingAcct);
  indexing.do.goToIndexingPage();
  I.waitForElement({ css: '.indexing-page' }, 10);
  I.click('.index-flow-form'); // after clicking open window file upload dialog
  I.attachFile('input[type=\'file\']', `manifest_${I.cache.UNIQUE_NUM}.tsv`);
  I.click({ xpath: 'xpath: //button[contains(text(), \'Index Files\')]' });

  await checkPod(I, 'manifest-indexing', 'sowerjob');

  const nAttempts = 12;
  for (let i = 0; i < nAttempts; i += 1) {
    console.log(`Looking up the indexd record... - attempt ${i}`);
    const indexdRecordRes = await I.sendGetRequest(
      `/index/${testGUID}`,
    );

    if (indexdRecordRes.data.hashes) {
      expect(indexdRecordRes.data.hashes.md5).to.equal(testHash);
      break;
    } else {
      console.log(`WARN: The indexd record has not been created yet... - attempt ${i}`);
      await sleepMS(5000);
      if (i === nAttempts - 1) {
        const manifestIndexingLogs = bash.runCommand('gen3 job logs manifest-indexing');
        if (process.env.DEBUG === 'true') {
          console.log(`manifest-indexing logs: ${manifestIndexingLogs}`);
        }
        throw new Error(`ERROR: The manifest indexing operation failed. Response: ${JSON.stringify(indexdRecordRes.data)}`);
      }
    }
  }
}).retry(2);

// Scenario #2 - Login and navigate to the indexing page and download a full indexd manifest
Scenario('Navigate to the indexing page and download a full indexd manifest @indexing', async ({
  I, indexing, home, users,
}) => {
  home.do.goToHomepage();
  await home.complete.login(users.indexingAcct);
  indexing.do.goToIndexingPage();
  I.waitForElement({ css: '.indexing-page' }, 10);
  I.click({ xpath: 'xpath: //button[contains(text(), \'Download\')]' });

  await checkPod(I, 'indexd-manifest', 'sowerjob');

  const waitingThreshold = 60;
  console.log('Waiting for Green status DONE to show up on the page...');
  await I.waitForElement({ css: '.index-files-green-label' }, waitingThreshold);

  await I.click({ xpath: 'xpath: //button[contains(text(), \'Download Manifest\')]' });
  // TODO: Inject the react -> state: { downloadManifestLink } url into an anchor tag
  const manifestDownloadUrl = await I.grabValueFrom({ xpath: 'xpath: //button[contains(text(), \'Download Manifest\')]' });
  if (process.env.DEBUG === 'true') {
    console.log(`### Manifest download url: ${manifestDownloadUrl}`);
  }
  const getManifestRes = await I.sendGetRequest(
    manifestDownloadUrl.toString(),
  );
  if (process.env.DEBUG === 'true') {
    console.log(`### downloadOuput: ${getManifestRes.data}`);
  }
  const downloadedManifestData = getManifestRes.data;

  expect(
    downloadedManifestData,
  ).to.include(
    expectedResult,
  );
}).retry(2);

// Scenario #3 - Negative test: navigate to the indexing page and upload imvalid  manifest
Scenario('Navigate to the indexing page and upload an invalid manifest @indexing', async ({
  I, indexing, home, users,
}) => {
  home.do.goToHomepage();
  await home.complete.login(users.indexingAcct);
  indexing.do.goToIndexingPage();
  I.waitForElement({ css: '.indexing-page' }, 10);
  I.click('.index-flow-form'); // after clicking open window file upload dialog
  I.attachFile('input[type=\'file\']', `invalid_manifest_${I.cache.UNIQUE_NUM}.tsv`);
  I.click({ xpath: 'xpath: //button[contains(text(), \'Index Files\')]' });

  await checkPod(I, 'manifest-indexing', 'sowerjob', { nAttempts: 5, ignoreFailure: true });

  const nAttempts = 12;
  for (let i = 0; i < nAttempts; i += 1) {
    console.log(`Wait for GUI error message... - attempt ${i}`);
    const statusMsg = await I.grabTextFrom({ xpath: '//div[@class="index-files-popup-text"]/p[1]' }, 10);
    if (process.env.DEBUG === 'true') {
      console.log(`Status: ${statusMsg}`);
    }
    await sleepMS(5000);
    if (!statusMsg.includes('Status')) {
      break;
    }
  }

  const manifestIndexingFailureMsg = await I.grabTextFrom({ xpath: '//div[@class="index-files-popup-text"]/descendant::p[2]' });
  if (process.env.DEBUG === 'true') {
    console.log(`html stuff: ${manifestIndexingFailureMsg}`);
  }
  expect(
    manifestIndexingFailureMsg,
  ).to.include(
    'failed',
  );
}).retry(2);
