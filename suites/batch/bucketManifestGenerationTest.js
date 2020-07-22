/*
 Bucket Manifest Generation tests (PXP-6373)
 This test plan has a few pre-requisites:
 1. A test bucket (bucket-manifest-ci-test) must be provisioned prior to the test run
    (containing 2 files whose content match the assertions)
 2. The environment must be configured with all the required gen3 cli dependencies
    (e.g., Terraform).
*/
Feature('Bucket Manifest Generation');

const { expect } = require('chai');
const fs = require('fs');
const tsv = require('tsv');
const { checkPod, sleepMS } = require('../../utils/apiUtil.js');
const { Bash } = require('../../utils/bash.js');

const bash = new Bash();

const testBucket = 'bucket-manifest-ci-test';
/* eslint-disable no-tabs */
const contentsOfAuthzMapping = `url	authz
s3://bucket-manifest-ci-test/test-file.txt	/programs/DEV/project/test`;

const expectedMetadataForAssertions = {
  test_file: {
    url: 's3://bucket-manifest-ci-test/test-file.txt',
    size: 21,
    md5: 'b36827811d9f452c42caa9043cf0dbf6',
    authz: '/programs/DEV/project/test',
  },
  humongous_file: {
    url: 's3://bucket-manifest-ci-test/humongous-file.bam',
    size: 5242880,
    md5: '5f363e0e58a95f06cbe9bbc662c5dfb6',
    authz: '',
  },
};

function deleteLingeringInfra() {
  console.log('deleting manifest_bucket-manifest-ci-test*.tsv files...');
  /* eslint-disable no-useless-escape */
  bash.runCommand(`
    find . -name "manifest_bucket-manifest-ci-test*.tsv" -exec rm {} \\\; -exec echo "deleted {}" \\\;
  `);
  console.log('deleting authz_mapping_*.tsv files...');
  bash.runCommand(`
    find . -name "authz_mapping_*.tsv" -exec rm {} \\\; -exec echo "deleted {}" \\\;
  `);

  console.log('deleting infra from previous runs that might\'ve been interrupted...');
  const lingeringInfra = bash.runCommand(`
    gen3 bucket-manifest --list | xargs -i echo "{} "
  `);

  if (lingeringInfra.length > 0) {
    console.log(`Found jobs in this namespace:\n  ${lingeringInfra}`);
    const jobIdsFromPreviousRuns = lingeringInfra.trim().split(' ');

    jobIdsFromPreviousRuns.forEach((jobId) => {
      console.log(`Tearing down infrastructure from job ${jobId}`);
      bash.runCommand(`
        echo yes | gen3 bucket-manifest --cleanup --job-id ${jobId}
      `);
    });
  }
}

BeforeSuite(async (I, files) => {
  deleteLingeringInfra();

  console.log('Setting up dependencies...');
  I.cache = {};
  I.cache.UNIQUE_NUM = Date.now();

  // create authz mapping file
  await files.createTmpFile(`authz_mapping_${I.cache.UNIQUE_NUM}.tsv`, contentsOfAuthzMapping);
});

AfterSuite(async (I) => {
  console.log(`I.cache: ${JSON.stringify(I.cache)}`);
  deleteLingeringInfra();
});

// Scenario #1 - Generate indexd manifest out of an s3 bucket
// and check if the expected url, size, md5 and authz entries are in place
Scenario('Generate bucket manifest from s3 bucket @bucketManifest', async (I) => {
  const theCmd = `gen3 bucket-manifest --create-jenkins --bucket ${testBucket} --authz ${__dirname}/authz_mapping_${I.cache.UNIQUE_NUM}.tsv`;
  console.log(`Running command: ${theCmd}`);
  bash.runCommand(theCmd);
  console.log('gen3 bucket-manifest process initiated. Waiting for infrastructure provisioning...');

  await sleepMS(20000);
  await checkPod('aws-bucket-manifest', 'gen3job', params = { nAttempts: 40, ignoreFailure: false }); // eslint-disable-line no-undef

  const bucketManifestList = bash.runCommand(`
    gen3 bucket-manifest --list | xargs -i echo "{} "
  `);
  console.log(`bucketManifestList: ${bucketManifestList}`);

  if (bucketManifestList.trim().split(' ').length > 1) {
    throw new Error(`ERROR: Found more than one jobId on namespace ${process.env.KUBECTL_NAMESPACE}.`);
  }

  const bucketManifestJobStatus = bash.runCommand(`
    gen3 bucket-manifest --status --job-id ${bucketManifestList.trim()} | tail -n10
  `);
  console.log(`bucketManifestJobStatus: ${bucketManifestJobStatus}`);

  const contentsOfTheFolder = bash.runCommand(`
    ls -ilha
  `);
  console.log(`contentsOfTheFolder: ${contentsOfTheFolder}`);

  const bucketManifestJobDataRaw = fs.readFileSync('paramFile.json', 'utf8');
  const bucketManifestJobData = JSON.parse(bucketManifestJobDataRaw);

  // Assertion - Job ID found in paramFile.json matches the output of gen3 bucket-manifest --list
  expect(bucketManifestJobData.job_id, 'The JobID found in paramFile.json does not match the id from [gen3 bucket-manifest --list]').to.be.equal(bucketManifestList.trim());
  // Store jobId to cleanup later
  I.cache.jobId = bucketManifestJobData.job_id;

  const listContentsOfTempBucketRaw = bash.runCommand(`
    aws s3 ls s3://${bucketManifestJobData.bucket_name} | grep manifest_
  `);
  const listContentsOfTempBucket = listContentsOfTempBucketRaw.split(/\s+/);
  console.log(`listContentsOfTempBucket: ${listContentsOfTempBucket}`);

  // Assertion - The temp bucket has been populated properly
  // e.g., 2020-07-21 02:24:26        184 manifest_bucket-manifest-ci-test_07_21_20_02:24:25.tsv
  expect(listContentsOfTempBucket).to.have.lengthOf(3);

  const bucketManifestFile = listContentsOfTempBucket[listContentsOfTempBucket.length - 1];

  const downloadManifestFromTempBucket = bash.runCommand(`
    aws s3 cp s3://${bucketManifestJobData.bucket_name}/${bucketManifestFile} .
  `);
  console.log(`downloadManifestFromTempBucket: ${downloadManifestFromTempBucket}`);

  // read contents of the manifest
  const bucketManifestContentsRaw = fs.readFileSync(bucketManifestFile, { encoding: 'utf8' });
  const bucketManifestTSV = tsv.parse(bucketManifestContentsRaw);

  // Final assertions
  ['humongous_file', 'test_file'].forEach((typeOfFile, idx) => {
    Object.keys(expectedMetadataForAssertions).forEach((assertionKey) => {
      console.log(`Running assertion for ${typeOfFile} (index: ${idx}) - TSV header: ${assertionKey}...`);
      const assertionFailureMsg = `The ${assertionKey} in the bucket manifest doesn't match the expected value for the ${typeOfFile}.`;
      expect(
        bucketManifestTSV[idx][assertionKey],
        assertionFailureMsg,
      ).to.be.equal(expectedMetadataForAssertions[typeOfFile][assertionKey]);
    });
  });
});
