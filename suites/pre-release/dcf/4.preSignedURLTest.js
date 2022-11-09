/* eslint-disable max-len */
// Feature # 4 in the sequence of testing
// This test plan has a few pre-requisites: Check prereq.md for more details.
Feature('4. PreSigned URLs - DCF Staging testing for release sign off - PXP-3836');

// To be executed with GEN3_SKIP_PROJ_SETUP=true
// No need to set up program / retrieve access token, etc.
const {
  requestUserInput,
} = require('../../../utils/apiUtil');
const oidcUtils = require('../../../utils/oidcUtils');

// Test elaborated for nci-crdc but it can be reused in other projects
const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'nci-crdc-staging.datacommons.io';

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
    oidcUtils.files.phs000BadFile1,
    oidcUtils.assembleCustomHeaders(I.cache.ACCESS_TOKEN),
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
    oidcUtils.assembleCustomHeaders(I.cache.ACCESS_TOKEN),
  );
  if (deleteFiles.status === 200) {
    console.log(`The uploaded indexd record ${I.cache.GUID} is deleted`);
  }
  delete I.cache.GUID;
  delete I.didList;
});

// Scenario #1 - Controlled Access Data - Google PreSignedURL test against DID the user can access
oidcUtils.performPreSignedURLTest('AWS S3', 'positive', 'Google');

// Scenario #2 - Controlled Access Data - Google PreSignedURL test against DID the user can't access
oidcUtils.performPreSignedURLTest('AWS S3', 'negative', 'Google');

// Scenario #3 - Controlled Access Data - Google PreSignedURL test against DID the user can access
oidcUtils.performPreSignedURLTest('Google Storage', 'positive', 'Google');

// Scenario #4 - Controlled Access Data - Google PreSignedURL test against DID the user can't access
oidcUtils.performPreSignedURLTest('Google Storage', 'negative', 'Google');
