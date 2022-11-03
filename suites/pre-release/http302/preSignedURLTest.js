Feature('4. PreSigned URLs - testing for release sign off');

// To be executed with GEN3_SKIP_PROJ_SETUP=true
// No need to set up program / retrieve access token, etc.
const { expect } = require('chai');
const { interactive, ifInteractive } = require('../../../utils/interactive.js');
const {
  requestUserInput,
} = require('../../../utils/apiUtil');

// Test elaborated for DataSTAGE but it can be reused in other projects
const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'preprod.gen3.biodatacatalyst.nhlbi.nih.gov';

BeforeSuite(async ({ I }) => {
  console.log('Setting up dependencies...');
  I.cache = {};

  if (process.env.TEST_CLIENT_ID === undefined) {
    throw new Error(`ERROR: There is no client_id defined for this ${TARGET_ENVIRONMENT} Test User. Please declare the "TEST_CLIENT_ID" environment variable and try again. Aborting test...`);
  } else if (process.env.TEST_SECRET_ID === undefined) {
    throw new Error(`ERROR: There is no secret_id defined for this ${TARGET_ENVIRONMENT} Test User. Please declare the "TEST_SECRET_ID" environment variable and try again. Aborting test...`);
  } else if (process.env.TEST_IMPLICIT_ID === undefined) {
    throw new Error(`ERROR: There is no implicit_id defined for this ${TARGET_ENVIRONMENT} Test User. Please declare the "TEST_IMPLICIT_ID" environment variable and try again. Aborting test...`);
  }

  I.TARGET_ENVIRONMENT = TARGET_ENVIRONMENT;
  // Fetching public list of DIDs
  const httpResp = await I.sendGetRequest(
    `https://${TARGET_ENVIRONMENT}/index/index`,
  );

  I.cache.records = httpResp.data.records;
});

async function fetchDIDLists(I, params = { hardcodedAuthz: null }) {
  // TODO: Use negate_params to gather authorized (200) and blocked (401) files
  // Only assemble the didList if the list hasn't been initialized
  let projectAccessList = [];
  let authParam = 'acl';
  const httpResp = await I.sendGetRequest(
    `https://${TARGET_ENVIRONMENT}/user`,
    { Authorization: `bearer ${I.cache.ACCESS_TOKEN}` },
  );
    // if hardcodedAuthz is set
    // check if the program/project path is in the /user/user authz output
  const foundHardcodedAuthzInResponse = Object.keys(httpResp.data.authz).filter((a) => params.hardcodedAuthz === a).join('');
  console.log(`foundHardcodedAuthzInResponse: ${foundHardcodedAuthzInResponse}`);
  if (foundHardcodedAuthzInResponse !== '') {
    console.log('switching the lookup auth param from [acl] to [authz]');
    authParam = 'authz';
    projectAccessList = httpResp.data.authz;
  } else {
    projectAccessList = httpResp.data.project_access;
  }
  // console.log(`projectAccessList: ${projectAccessList}`);

  // initialize dict of accessible DIDs
  let ok200files = {}; // eslint-disable-line prefer-const
  // initialize dict of blocked DIDs
  let unauthorized401files = {}; // eslint-disable-line prefer-const

  // adding record DIDs to their corresponding ACL key
  // ( I.cache.records is created in BeforeSuite() )
  I.cache.records.forEach((record) => {
    // console.log('ACLs for ' + record['did'] + ' - ' + record['acl']);
    // Filtering accessible DIDs by checking if the record acl is in the project access list
    const accessibleDid = record[authParam].filter(
      (acl) => projectAccessList.hasOwnProperty(acl) || record[authParam].includes('*'), // eslint-disable-line no-prototype-builtins
    );

    // Put DIDs urls and md5 hash into their respective lists (200 or 401)
    const theFiles = accessibleDid.length > 0 ? ok200files : unauthorized401files;
    theFiles[record.did] = { urls: record.urls, md5: record.md5 };
  });

  // the cache
  I.didList = {};
  I.didList.ok200files = ok200files;
  I.didList.unauthorized401files = unauthorized401files;

  return I.didList;
}
//
function performPreSignedURLTest(cloudProvider, typeOfTest, typeOfCreds) {
  Scenario(`Perform ${cloudProvider} PreSigned URL ${typeOfTest} test against DID with ${typeOfCreds} credentials @manual`, ifInteractive(
    async ({ I }) => {
      if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
      // Obtain project access list to determine which files(DIDs) the user can access
      // two lists: http 200 files and http 401 files

      const params = TARGET_ENVIRONMENT.includes('theanvil') ? { hardcodedAuthz: '/programs/CF/projects/GTEx' } : {};
      const { ok200files, unauthorized401files } = I.didList
        ? I.didList
        : await fetchDIDLists(I, params);
      console.log(`http 200 files: ${JSON.stringify(ok200files)}`);
      console.log(`http 401 files: ${JSON.stringify(unauthorized401files)}`);

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
      const signedUrlRes = await I.sendGetRequest(
        `https://${TARGET_ENVIRONMENT}/user/data/download/${selectedDid}`,
        { Authorization: `bearer ${I.cache.ACCESS_TOKEN}` },
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
                  RESPONSE: ${JSON.stringify(signedUrlRes.data)}
        `);
      expect(result.didPass, result.details).to.be.true;
    },
  ));
}

// Scenario #3 - Controlled Access Data - Google PreSignedURL test against DID the user can't access
// TODO: internalstaging.datastage is missing a sample file for this scenario
performPreSignedURLTest('Google Storage', 'negative', 'Google');

// Scenario #4 - Controlled Access Data - Google PreSignedURL test against DID the user can access
performPreSignedURLTest('Google Storage', 'positive', 'Google');

// Scenario #5 - Controlled Access Data - Google PreSignedURL test against DID the user can't access
// TODO: internalstaging.datastage is missing a sample file for this scenario
performPreSignedURLTest('AWS S3', 'negative', 'Google');

// Scenario #6 - Controlled Access Data - Google PreSignedURL test against DID the user can access
performPreSignedURLTest('AWS S3', 'positive', 'Google');

// Scenario #9 - Controlled Access Data - Google PreSignedURL test against DID the user cant access
performPreSignedURLTest('Google Storage', 'negative', 'NIH');

// Scenario #10 - Controlled Access Data - Google PreSignedURL test against DID the user can access
// TODO: internalstaging.datastage is missing a sample file for this scenario
performPreSignedURLTest('Google Storage', 'positive', 'NIH');

// Scenario #11 - Controlled Access Data - Google PreSignedURL test against DID the user cant access
performPreSignedURLTest('AWS S3', 'negative', 'NIH');

// Scenario #12 - Controlled Access Data - Google PreSignedURL test against DID the user can access
performPreSignedURLTest('AWS S3', 'positive', 'NIH');
