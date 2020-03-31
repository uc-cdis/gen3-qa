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
// TODO: Verify better approach to find DIDs for positive and negative tests based
// on the "/index?acl=<acl>" API call

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

    // adding record DIDs to their corresponding ACL key
    // ( I.cache.records is created in BeforeSuite() )
    I.cache.records.forEach((record) => {
      // console.log('ACLs for ' + record['did'] + ' - ' + record['acl']);
      // Filtering accessible DIDs by checking if the record acl is in the project access list
      const accessibleDid = record.acl.filter(
        (acl) => projectAccessList.hasOwnProperty(acl) || record.acl === '*', // eslint-disable-line no-prototype-builtins
      );

      // Put DIDs urls and md5 hash into their respective lists (200 or 401)
      const theFiles = accessibleDid.length > 0 ? ok200files : unauthorized401files;
      theFiles[record.did] = { urls: record.urls, md5: record.md5 };
    });

    console.log(`http 200 files: ${JSON.stringify(ok200files)}`);
    console.log(`http 401 files: ${JSON.stringify(unauthorized401files)}`);

    I.didList = {};
    I.didList.ok200files = ok200files;
    I.didList.unauthorized401files = unauthorized401files;

    return I.didList;
  }
  return I.didList;
}

function performPreSignedURLTest(cloudProvider, typeOfTest, typeOfCreds) {
  Scenario(`Perform ${cloudProvider} PreSigned URL ${typeOfTest} test against DID with ${typeOfCreds} credentials @manual`, ifInteractive(
    async (I, fence) => {
      if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
      // Obtain project access list to determine which files(DIDs) the user can access
      // two lists: http 200 files and http 401 files
      const { ok200files, unauthorized401files } = await fetchDIDLists(I);

      // positive: _200files | negative: _401files
      const listOfDIDs = typeOfTest === 'positive' ? ok200files : unauthorized401files;
      // AWS: s3:// | Google: gs://
      const preSignedURLPrefix = cloudProvider === 'AWS S3' ? 's3://' : 'gs://';

      console.log(`list_of_DIDs: ${JSON.stringify(listOfDIDs)}`);

      const filteredDIDs = Object.keys(listOfDIDs).reduce((filtered, key) => {
        listOfDIDs[key].urls.forEach((url) => {
          if (url.startsWith(preSignedURLPrefix)) filtered[key] = listOfDIDs[key];
        });
        return filtered;
      }, {});

      // Must have at least one sample to conduct this test
      const selectedDid = Object.keys(filteredDIDs)[0];
      // PreSignedURL request
      const signedUrlRes = await fence.do.createSignedUrl(
        `${selectedDid}`,
        [],
        assembleCustomHeaders(I.cache.ACCESS_TOKEN),
      );

      // TODO: Run `wget` with PreSignedURL and check if md5 matches the record['md5']

      const verificationMessage = typeOfTest === 'positive' ? `
                a. The HTTP response code is Ok/200.
                b. The response contain valid URLs to the files stored in AWS S3 or GCP Buckets.` : `
                a. The HTTP response code is 401.
                b. The response contains a Fence error message.`;

      const result = await interactive(`
              1. [Automated] Selected DID [${selectedDid}] to perform a ${typeOfTest} ${cloudProvider} PreSigned URL test with ${typeOfCreds} credentials.
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

BeforeSuite(async (I) => {
  console.log('Setting up dependencies...');
  I.cache = {};
  I.TARGET_ENVIRONMENT = TARGET_ENVIRONMENT;
  // Fetching public list of DIDs
  const httpResp = await I.sendGetRequest(
    `https://${TARGET_ENVIRONMENT}/index/index`,
  ).then((res) => new Gen3Response(res));

  I.cache.records = httpResp.body.records;
});

// Scenario #1 - Controlled Access Data - Google PreSignedURL test against DID the user can't access
performPreSignedURLTest('Google Storage', 'negative', 'Google');

// Scenario #2 - Controlled Access Data - Google PreSignedURL test against DID the user can access
performPreSignedURLTest('Google Storage', 'positive', 'Google');

// Scenario #3 - Controlled Access Data - Google PreSignedURL test against DID the user can't access
performPreSignedURLTest('AWS S3', 'negative', 'Google');

// Scenario #4 - Controlled Access Data - Google PreSignedURL test against DID the user can access
performPreSignedURLTest('AWS S3', 'positive', 'Google');
