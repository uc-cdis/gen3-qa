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

// 1. create a file to be uploaded to indexd (done)
// 2. upload the record to indexd - beforeSuite (done)
// 3. get the Guid Id for the files 
// 4. try to create presignedurl
// 5. delete the record from indexd - afterSuite (done)

const files = {
  file1: {
    filename: 'invalid_test_file1',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '',
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

// solution
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
        ok200files[record200Resp.data.records[0].did] = { urls: record200Resp.data.records[0].urls };
      }
    }

    // assemble 401 unauthorized ids
    const record401Resp = await I.sendGetRequest(
      `https://${TARGET_ENVIRONMENT}/index/index?acl=phs000bad`,
    );
    unauthorized401files[record401Resp.data.records[0].did] = { urls: record401Resp.data.records[0].urls}

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
      if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
      // Obtain project access list to determine which files(DIDs) the user can access
      // two lists: http 200 files and http 401 files
      const { ok200files, unauthorized401files } = await fetchDIDLists(I);

      // positive: _200files | negative: _401files
      // const listOfDIDs = typeOfTest === 'positive' ? ok200files : unauthorized401files;
      let filteredDIDs = [];
      if (typeOfTest === 'positive') {
        // AWS: s3:// | Google: gs://
        const preSignedURLPrefix = cloudProvider === 'AWS S3' ? 's3://' : 'gs://';

        // filter the urls based on type of tests
        for (const key in ok200files) { // eslint-disable-line guard-for-in
          ok200files[key].urls.forEach((url) => { // eslint-disable-line no-loop-func
            if (url.startsWith(preSignedURLPrefix)) filteredDIDs.push(key, url);
          });
        }
      } else {
        filteredDIDs = unauthorized401files;
      }

      console.log('-------');
      console.log(filteredDIDs);

      // Must have at least one sample to conduct this test
      const selectedDid = filteredDIDs[0];
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
                a. The HTTP response code is 404.
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

BeforeSuite(async ({ I, indexd }) => {
  console.log('Setting up dependencies...');
  I.cache = {};
  I.TARGET_ENVIRONMENT = TARGET_ENVIRONMENT;
  // Fetching public list of DIDs
  // cache the indexd response if feasible - should be good solution for
  // decreasing the execution time as the records arent changed
  const httpResp = await I.sendGetRequest(
    `https://${TARGET_ENVIRONMENT}/index/index`,
  ).then((res) => new Gen3Response(res));

  I.cache.records = httpResp.body.records;

  const ok = await indexd.do.addFileIndices(Object.values(files));
  expect(ok).to.be.true;
});

AfterSuite(async ({ indexd }) => {
  await indexd.do.deleteFileIndices(Object.values(files));
});

// Scenario #1 - Controlled Access Data - Google PreSignedURL test against DID the user can't access
performPreSignedURLTest('Google Storage', 'negative');

// Scenario #2 - Controlled Access Data - Google PreSignedURL test against DID the user can access
performPreSignedURLTest('Google Storage', 'positive');

// Scenario #3 - Controlled Access Data - Google PreSignedURL test against DID the user can't access
performPreSignedURLTest('AWS S3', 'negative');

// Scenario #4 - Controlled Access Data - Google PreSignedURL test against DID the user can access
performPreSignedURLTest('AWS S3', 'positive');
