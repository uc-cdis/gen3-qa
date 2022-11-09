/* eslint-disable max-len */
Feature('4. PreSigned URLs - testing for release sign off');

// To be executed with GEN3_SKIP_PROJ_SETUP=true
// No need to set up program / retrieve access token, etc.
// const { expect } = require('chai');
// const { interactive, ifInteractive } = require('../../../utils/interactive.js');
// const {
//   requestUserInput,
// } = require('../../../utils/apiUtil');

const oidcUtils = require('../../../utils/oidcUtils');

// Test elaborated for DataSTAGE but it can be reused in other projects
// const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'preprod.gen3.biodatacatalyst.nhlbi.nih.gov';
const TARGET_ENVIRONMENT = 'preprod.gen3.biodatacatalyst.nhlbi.nih.gov';

BeforeSuite(async ({ I }) => {
  console.log('Setting up dependencies...');
  I.cache = {};

  I.TARGET_ENVIRONMENT = TARGET_ENVIRONMENT;
  // Fetching public list of DIDs
  const httpResp = await I.sendGetRequest(
    `https://${TARGET_ENVIRONMENT}/index/index`,
  );

  I.cache.records = httpResp.data.records;
});

// Scenario #3 - Controlled Access Data - Google PreSignedURL test against DID the user can't access
// TODO: internalstaging.datastage is missing a sample file for this scenario
oidcUtils.performPreSignedURLTest('Google Storage', 'negative', 'Google');

// Scenario #4 - Controlled Access Data - Google PreSignedURL test against DID the user can access
oidcUtils.performPreSignedURLTest('Google Storage', 'positive', 'Google');

// Scenario #5 - Controlled Access Data - Google PreSignedURL test against DID the user can't access
// TODO: internalstaging.datastage is missing a sample file for this scenario
oidcUtils.performPreSignedURLTest('AWS S3', 'negative', 'Google');

// Scenario #6 - Controlled Access Data - Google PreSignedURL test against DID the user can access
oidcUtils.performPreSignedURLTest('AWS S3', 'positive', 'Google');

// Scenario #9 - Controlled Access Data - Google PreSignedURL test against DID the user cant access
oidcUtils.performPreSignedURLTest('Google Storage', 'negative', 'NIH');

// Scenario #10 - Controlled Access Data - Google PreSignedURL test against DID the user can access
// TODO: internalstaging.datastage is missing a sample file for this scenario
oidcUtils.performPreSignedURLTest('Google Storage', 'positive', 'NIH');

// Scenario #11 - Controlled Access Data - Google PreSignedURL test against DID the user cant access
oidcUtils.performPreSignedURLTest('AWS S3', 'negative', 'NIH');

// Scenario #12 - Controlled Access Data - Google PreSignedURL test against DID the user can access
oidcUtils.performPreSignedURLTest('AWS S3', 'positive', 'NIH');
