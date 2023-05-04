/* eslint-disable max-len */
// Feature # 4 in the sequence of testing
// This test plan has a few pre-requisites: Check prereq.md for more details.
Feature('4. PreSigned URLs - DCF Staging testing for release sign off - PXP-3836');

// To be executed with GEN3_SKIP_PROJ_SETUP=true
// No need to set up program / retrieve access token, etc.

const { expect } = require('chai');
const { interactive, ifInteractive } = require('../../../utils/interactive.js');
const {
  Gen3Response, requestUserInput,
} = require('../../../utils/apiUtil');

// Test elaborated for nci-crdc but it can be reused in other projects
const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'nci-crdc-staging.datacommons.io';

const files = {
  phs000BadFile1: {
    file_name: 'invalid_test_file1',
    urls: ['s3://cdis-presigned-url-test/testdata', 'gs://cdis-presigned-url-test/testdata'],
    form: 'object',
    hashes: { md5: 'b93da58abe894cab4682b1260e4e085b' }, // pragma: allowlist secret
    acl: ['phs000bad'],
    size: 9,
  },
};

function assembleCustomHeaders(ACCESS_TOKEN) {
  // Add ACCESS_TOKEN to custom headers
  return {
    Accept: 'application/json',
    Authorization: `bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

// TODO: Consolidate some of the common scenarios across other executable tests to avoid duplicates
// e.g., The "fetchDIDLists()" function is also included in suites/apis/dataStageOIDCFlowTest.js

async function fetchDIDLists(I) {
  // Only assemble the didList if the list hasn't been initialized
  if (!I.didList) {
    const httpResp = await I.sendGetRequest(
      `https://${TARGET_ENVIRONMENT}/user/user`,
      { Authorization: `bearer ${I.cache.ACCESS_TOKEN}` },
    ).then((res) => new Gen3Response(res));

    const projectAccessList = httpResp.body.project_access;

    // initialize dict of accessible DIDs
    let ok200files = {}; // eslint-disable-line prefer-const
    // initialize dict of blocked DIDs
    let unauthorized401files = {}; // eslint-disable-line prefer-const

    // assemble 200 authorized ids
    const authorized200Project = ['*'];
    for (const i in projectAccessList) { // eslint-disable-line guard-for-in
      authorized200Project.push(i);
    }
    console.log(`Authorized project : ${JSON.stringify(authorized200Project)}`);

    for (const project of authorized200Project) {
      const record200Resp = await I.sendGetRequest(
        `https://${TARGET_ENVIRONMENT}/index/index?acl=${project}&limit=1`,
      );
      if ((record200Resp.data.records.length) === 0) {
        console.log('No Record/DID');
      } else {
        ok200files[record200Resp.data.records[0].did] = {
          urls: record200Resp.data.records[0].urls,
        };
      }
    }

    console.log(`GUID selected: ${I.cache.GUID}`);
    // assemble 401 unauthorized ids
    const record401Resp = await I.sendGetRequest(
      `https://${TARGET_ENVIRONMENT}/index/index/${I.cache.GUID}`,
    );
    unauthorized401files[record401Resp.data.did] = { urls: record401Resp.data.urls };

    console.log(`http 200 files: ${JSON.stringify(ok200files)}`);
    console.log(`http 401 files: ${JSON.stringify(unauthorized401files)}`);

    I.didList = {};
    I.didList.ok200files = ok200files;
    I.didList.unauthorized401files = unauthorized401files;

    return I.didList;
  }
  return I.didList;
}

function performPreSignedURLTest(cloudProvider, typeOfTest) {
  Scenario(`Perform ${cloudProvider} PreSigned URL ${typeOfTest} test against DID@manual`, ifInteractive(
    async ({ I, fence }) => {
      const filteredDIDs = {};
      if (I.cache.ACCESS_TOKEN) {
        // Obtain project access list to determine which files(DIDs) the user can access
        // two lists: http 200 files and http 401 files
        const { ok200files, unauthorized401files } = await fetchDIDLists(I);

        const listOfDIDs = typeOfTest === 'positive' ? ok200files : unauthorized401files;
        console.log('####');
        console.log(`The Selected List of DIDs : ${JSON.stringify(listOfDIDs)}`);

        // AWS: s3:// | Google: gs://
        const preSignedURLPrefix = cloudProvider === 'AWS S3' ? 's3://' : 'gs://';

        for (const key in listOfDIDs) { // eslint-disable-line guard-for-in
          listOfDIDs[key].urls.forEach((url) => { // eslint-disable-line no-loop-func
            if (url.startsWith(preSignedURLPrefix)) filteredDIDs[key] = url;
          });
        }
      }

      console.log('####');
      console.log(filteredDIDs);

      // selecting random key DID from the list
      const keys = Object.keys(filteredDIDs);
      const selectedDid = keys[Math.floor(Math.random() * keys.length)];
      console.log(`#### Selected DID : ${JSON.stringify(selectedDid)}`);
      // PreSignedURL request
      const signedUrlRes = await fence.do.createSignedUrl(
        `${selectedDid}`,
        [],
        assembleCustomHeaders(I.cache.ACCESS_TOKEN),
      );

      const verificationMessage = typeOfTest === 'positive' ? `
                a. The HTTP response code is Ok/200.
                b. The response contain valid URLs to the files stored in AWS S3 or GCP Buckets.` : `
                a. The HTTP response code is 401.
                b. The response contains a Fence error message.`;

      const result = await interactive(`
              1. [Automated] Selected DID [${selectedDid}] to perform a ${typeOfTest} ${cloudProvider} PreSigned URL test.
              2. [Automated] Executed an HTTP GET request (using the ACCESS_TOKEN provided).
              3. Verify if:${verificationMessage}
              Manual verification:
                HTTP Code: ${signedUrlRes.status}
                RESPONSE: ${JSON.stringify(signedUrlRes.body) || signedUrlRes.parsedFenceError}
      `);
      expect(result.didPass, result.details).to.be.true;
    },
  ));
}

BeforeSuite(async ({ I }) => {
  console.log('Setting up dependencies...');
  I.cache = {};
  I.TARGET_ENVIRONMENT = TARGET_ENVIRONMENT;
  // // Fetching public list of DIDs
  // const httpResp = await I.sendGetRequest(
  //   `https://${TARGET_ENVIRONMENT}/index/index`,
  // ).then((res) => new Gen3Response(res));

  // I.cache.records = httpResp.body.records;

  console.log('Getting user ACCESS_TOKEN: ');
  I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
});

Before(async ({ I }) => {
  console.log('Uploading ...');
  // upload const files to indexd
  const uploadResp = await I.sendPostRequest(
    `https://${TARGET_ENVIRONMENT}/index/index`,
    files.phs000BadFile1,
    assembleCustomHeaders(I.cache.ACCESS_TOKEN),
  );
  console.log(`The Upload Record : ${JSON.stringify(uploadResp.data)}`);
  // get the GUID for the recently upload record
  I.cache.GUID = uploadResp.data.did;
  console.log(`### GUID of new upload file : ${I.cache.GUID}`);
  I.cache.REV = uploadResp.data.rev;
});

After(async ({ I }) => {
  console.log('Deleting indexd record ... ');
  const deleteFiles = await I.sendDeleteRequest(
    `https://${TARGET_ENVIRONMENT}/index/index/${I.cache.GUID}?rev=${I.cache.REV}`,
    assembleCustomHeaders(I.cache.ACCESS_TOKEN),
  );
  if (deleteFiles.status === 200) {
    console.log(`The uploaded indexd record ${I.cache.GUID} is deleted`);
  }
  delete I.cache.GUID;
  delete I.didList;
});

// Scenario #1 - Controlled Access Data - Google PreSignedURL test against DID the user can access
performPreSignedURLTest('AWS S3', 'positive');

// Scenario #2 - Controlled Access Data - Google PreSignedURL test against DID the user can't access
performPreSignedURLTest('AWS S3', 'negative');

// Scenario #3 - Controlled Access Data - Google PreSignedURL test against DID the user can access
performPreSignedURLTest('Google Storage', 'positive');

// Scenario #4 - Controlled Access Data - Google PreSignedURL test against DID the user can't access
performPreSignedURLTest('Google Storage', 'negative');
