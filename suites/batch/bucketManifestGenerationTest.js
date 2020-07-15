/*
 Bucket Manifest Generation tests (PXP-6373)
 This test plan has a few pre-requisites:
 1. A test bucket (bucket-manifest-ci-test) must be provisioned prior to the test run 
    (containing 2 files whose content match the assertions)
 2. The environment must be configured with all the required gen3 cli dependencies (e.g., Terraform).
*/
Feature('Bucket Manifest Generation');

const { expect } = require('chai');
const { checkPod, sleepMS, Gen3Response } = require('../../utils/apiUtil.js');
const { Bash } = require('../../utils/bash.js');

const bash = new Bash();

const testBucket = 'bucket-manifest-ci-test';

const expectedMetadataForAssertions = {
  test_file: {
    url: ''
    size: 'SRS1361261',
    md5: '95a41871-222c-48ae-8004-63f4ed1f0691',
    authz: '/programs/DEV/project/test',
  },
  humongous_file: {
    size: 'ad3bf4ad-1063-4e1b-97b0-4a31b777bea7',
    md5: 'ad3bf4ad-1063-4e1b-97b0-4a31b777bea7',
    authz: '',
  },
};

AfterSuite(async (I) => {
  console.log('deleting temporary bucket...');
  const deletingTempBucket = bash.runCommand(`echo yes | gen3 bucket-manifest cleanup <job id>`);
  console.log(`deletingTempBucket: ${deletingTempBucket}`);
});

// Scenario #1 - Generate indexd manifest out of an s3 bucket
// and check if the expected size, md5 and authz entries are in place
Scenario('Generate bucket manifest from s3 bucket @bucketManifest', async (I, users) => {
  const deletingTempBucket = bash.runCommand(`gen3 bucket-manifest cleanup`);
  console.log(`deletingTempBucket: ${deletingTempBucket}`);

  await checkPod(sowerJobName, 'bucket-manifest');

  const downloadManifestFromTempBucket = bash.runCommand(`aws s3 cp s3://<temp-bucket>/manifest.tsv .`);
  console.log(`downloadManifestFromTempBucket: ${downloadManifestFromTempBucket}`);

  const  = bash.runCommand(`aws s3 cp s3://<temp-bucket>/manifest.tsv .`);
  console.log(`downloadManifestFromTempBucket: ${downloadManifestFromTempBucket}`);

  // read contents of the manifest
  const bucketManifest = fs.readFileSync('manifest.tsv', { encoding: 'utf8' });

  // TODO: Use tsv parser
    expect(parsedTSV.url, `The url in the bucket manifest doesn't match the expected value.`).to.be.equal();
    expect(parsedTSV.size, `The size in the bucket manifest doesn't match the expected value.`).to.be.equal();
    expect(parsedTSV.md5, `The md5 in the bucket manifest doesn't match the expected value.`).to.be.equal();
  expect(parsedTSV.authz, `The authz in the bucket manifest doesn't match the expected value.`).to.be.equal();
}).retry(1);
