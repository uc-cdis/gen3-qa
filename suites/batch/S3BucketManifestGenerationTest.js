/*
 Bucket Manifest Generation tests (PXP-6373)
 This test plan has a few pre-requisites:
 1. A test bucket (bucket-manifest-ci-test) must be provisioned prior to the test run
    (containing 2 files whose content match the assertions)
 2. The environment must be configured with all the required gen3 cli dependencies
    (e.g., Terraform).
*/
Feature('S3 Bucket Manifest Generation');

const { expect } = require('chai');
const tsv = require('tsv');
const { checkPod, sleepMS } = require('../../utils/apiUtil.js');
const { Bash } = require('../../utils/bash.js');

const bash = new Bash();

const testBucket = 'bucket-manifest-ci-test';
/* eslint-disable no-tabs */
const contentsOfAuthzMapping = 'url\tauthz\ns3://bucket-manifest-ci-test/test-file.txt\t/programs/DEV/project/test';

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

async function deleteLingeringInfra() {
  console.log('deleting manifest_bucket-manifest-ci-test*.tsv files...');
  /* eslint-disable no-useless-escape */
  await bash.runCommand(`
    find . -name "manifest_bucket-manifest-ci-test*.tsv" -exec rm {} \\\; -exec echo "deleted {}" \\\;
  `);
  console.log('deleting authz_mapping_*.tsv files...');
  await bash.runCommand(`
    find . -name "authz_mapping_*.tsv" -exec rm {} \\\; -exec echo "deleted {}" \\\;
  `);

  console.log('looking for lingering bucket-manifest jobs...');
  const lingeringInfra = await bash.runCommand(`
    gen3 bucket-manifest --list | xargs -i echo "{} "
  `);

  if (lingeringInfra.length > 0) {
    if (process.env.DEBUG === 'true') {
      console.log(`Found jobs in this namespace:\n  ${lingeringInfra}`);
    }
    const jobIdsFromPreviousRuns = lingeringInfra.trim().split(' ');

    jobIdsFromPreviousRuns.forEach(async (jobId) => {
      console.log(`Tearing down infrastructure from job ${jobId}`);
      await bash.runCommand(`
        echo yes | gen3 bucket-manifest --cleanup --job-id ${jobId}
      `);
    });
  }
}

BeforeSuite(async ({ I }) => {
  try {
    console.log('deleting infra from previous runs that might\'ve been interrupted...');
    await deleteLingeringInfra();

    console.log('Setting up dependencies...');
    I.cache = {};
    I.cache.UNIQUE_NUM = Date.now();

    console.log('creating authz mapping file...');
    const authzMappingFile = await bash.runCommand(`
      echo -e \"${contentsOfAuthzMapping}\" | tee -a authz_mapping_${I.cache.UNIQUE_NUM}.tsv
    `);
    if (process.env.DEBUG === 'true') {
      console.log(`authzMappingFile: ${authzMappingFile}`);
    }
  } catch (error) {
    console.err(error);
  }
});

AfterSuite(async ({ I }) => {
  if (process.env.DEBUG === 'true') {
    console.log(`I.cache: ${JSON.stringify(I.cache)}`);
  }
  try {
    await deleteLingeringInfra();
  } catch (error) {
    console.log(error);
  }
});

// Scenario #1 - Generate indexd manifest out of an s3 bucket
// and check if the expected url, size, md5 and authz entries are in place
Scenario('Generate bucket manifest from s3 bucket @amazonS3 @batch @bucketManifest', async ({ I }) => {
  const theCmd = `gen3 bucket-manifest --create --bucket ${testBucket} --authz $PWD/authz_mapping_${I.cache.UNIQUE_NUM}.tsv --output-variables`;
  console.log(`Running command: ${theCmd}`);
  await bash.runCommand(theCmd);
  console.log('gen3 bucket-manifest process initiated. Waiting for infrastructure provisioning...');

  await sleepMS(20000);
  await checkPod(I, 'aws-bucket-manifest', 'gen3job', params = { nAttempts: 100, ignoreFailure: false, keepSessionAlive: true }); // eslint-disable-line no-undef

  const bucketManifestList = await bash.runCommand(`
    gen3 bucket-manifest --list | xargs -i echo "{} "
  `);
  if (process.env.DEBUG === 'true') {
    console.log(`bucketManifestList: ${bucketManifestList}`);
  }
  if (bucketManifestList.trim().split(' ').length > 1) {
    throw new Error(`ERROR: Found more than one jobId on namespace ${process.env.KUBECTL_NAMESPACE}.`);
  }

  // read contents of the paramFile.json containing the bucket name
  const bucketManifestJobDataRaw = await bash.runCommand(`
    cat paramFile.json
  `);
  if (process.env.DEBUG === 'true') {
    console.log(`bucketManifestJobDataRaw: ${bucketManifestJobDataRaw}`);
  }
  const bucketManifestJobData = JSON.parse(bucketManifestJobDataRaw);

  const listContentsOfTempBucketRaw = await bash.runCommand(`
    aws s3 ls s3://${bucketManifestJobData.bucket_name} | grep manifest_
  `);
  if (process.env.DEBUG === 'true') {
    console.log(`listContentsOfTempBucketRaw: ${listContentsOfTempBucketRaw}`);
  }
  const listContentsOfTempBucket = listContentsOfTempBucketRaw.split(/\s+/);
  if (process.env.DEBUG === 'true') {
    console.log(`listContentsOfTempBucket: ${listContentsOfTempBucket}`);
  }
  // Assertion - The temp bucket has been populated properly
  // e.g., 2020-07-21 02:24:26        184 manifest_bucket-manifest-ci-test_07_21_20_02:24:25.tsv
  expect(listContentsOfTempBucket).to.have.lengthOf(4);

  const bucketManifestFile = listContentsOfTempBucket[listContentsOfTempBucket.length - 1];

  const downloadManifestFromTempBucket = await bash.runCommand(`
    aws s3 cp s3://${bucketManifestJobData.bucket_name}/${bucketManifestFile} .
  `);
  if (process.env.DEBUG === 'true') {
    console.log(`downloadManifestFromTempBucket: ${downloadManifestFromTempBucket}`);
  }
  // read contents of the manifest
  // replacing EOL (End Of Line) after receiving the one-line string from bash
  let bucketManifestContentsRaw = await bash.runCommand(`
    cat ${bucketManifestFile} | xargs -i echo "{}[EOL]"
  `);
  bucketManifestContentsRaw = bucketManifestContentsRaw.replace(/\[EOL\]/g, '\n');
  if (process.env.DEBUG === 'true') {
    console.log(`bucketManifestContentsRaw: ${bucketManifestContentsRaw}`);
  }
  let bucketManifestTSV = tsv.parse(bucketManifestContentsRaw);
  if (process.env.DEBUG === 'true') {
    console.log(`bucketManifestTSV: ${JSON.stringify(bucketManifestTSV)}`);
  }

  bucketManifestTSV = bucketManifestTSV.sort((a, b) => a.size - b.size);
  if (process.env.DEBUG === 'true') {
    console.log(`sorted bucketManifestTSV: ${JSON.stringify(bucketManifestTSV)}`);
  }
  // Final assertions
  const files = ['test_file', 'humongous_file'];
  for (let i = 0; i < files.length; i++) { // eslint-disable-line no-plusplus
    Object.keys(expectedMetadataForAssertions[files[i]]).forEach((assertionKey) => {
      console.log(`Running assertion for ${files[i]} (index: ${i}) - TSV header: ${assertionKey}...`);
      const assertionFailureMsg = `The ${assertionKey} in the bucket manifest doesn't match the expected value for the ${files[i]}.`;
      expect(
        bucketManifestTSV[i][assertionKey],
        assertionFailureMsg,
      ).to.be.equal(expectedMetadataForAssertions[files[i]][assertionKey]);
    });
  }
});
