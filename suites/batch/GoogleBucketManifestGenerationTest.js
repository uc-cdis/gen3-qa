/*
 Google Bucket Manifest Generation tests (PXP-6626)
 This test plan has a few pre-requisites:
 1. A test bucket (bucket-manifest-ci-test-gs) must be provisioned prior to the test run
    (containing 2 files whose content match the assertions)
 2. The environment must be configured with all the required gen3 cli dependencies
    (e.g., Terraform and the gcp-bucket-manifest-test service account).
*/
Feature('Google Bucket Manifest Generation');

const { expect } = require('chai');
const tsv = require('tsv');
const { checkPod, sleepMS } = require('../../utils/apiUtil.js');
const { Bash } = require('../../utils/bash.js');

const bash = new Bash();

const testBucket = 'bucket-manifest-ci-test-gs';
/* eslint-disable no-tabs */
const contentsOfAuthzMapping = 'url\tauthz\ngs://bucket-manifest-ci-test-gs/test-file.txt\t/programs/DEV/project/test';

const expectedMetadataForAssertions = {
  test_file: {
    url: 'gs://bucket-manifest-ci-test-gs/test-file.txt',
    size: 21,
    md5: 'b36827811d9f452c42caa9043cf0dbf6',
    authz: '/programs/DEV/project/test',
  },
  humongous_file: {
    url: 'gs://bucket-manifest-ci-test-gs/humongous-file.bam',
    size: 5242880,
    md5: '5f363e0e58a95f06cbe9bbc662c5dfb6',
    authz: '',
  },
};

async function deleteLingeringInfra() {
  console.log('deleting manifest_bucket-manifest-ci-test*.tsv files...');
  /* eslint-disable no-useless-escape */
  await bash.runCommand(`
    find . -name "gcp_manifest_bucket-manifest-ci-test*.tsv" -exec rm {} \\\; -exec echo "deleted {}" \\\;
  `);
  console.log('deleting authz_mapping_*.tsv files...');
  await bash.runCommand(`
    find . -name "authz_mapping_*.tsv" -exec rm {} \\\; -exec echo "deleted {}" \\\;
  `);

  console.log('looking for lingering bucket-manifest jobs...');
  const lingeringInfra = await bash.runCommand(`
    gen3 gcp-bucket-manifest list | xargs -i echo "{} "
  `);
  if (process.env.DEBUG === 'true') {
    console.log(`lingeringInfra: ${lingeringInfra}`);
  }
  if (lingeringInfra.length > 0) {
    if (process.env.DEBUG === 'true') {
      console.log(`Found jobs in this namespace:\n  ${lingeringInfra}`);
    }
    const jobIdsFromPreviousRuns = lingeringInfra.trim().split(' ');

    jobIdsFromPreviousRuns.forEach(async (jobId) => {
      console.log(`Tearing down infrastructure from job ${jobId}`);
      await bash.runCommand(`
        echo yes | gen3 gcp-bucket-manifest cleanup ${jobId}
      `);
    });
  }
}

BeforeSuite(async ({ I }) => {
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

// Scenario #1 - Generate indexd manifest out of a Google Storage bucket
// and check if the expected url, size, md5 and authz entries are in place
Scenario('Generate bucket manifest from Google Storage bucket @googleStorage @batch @bucketManifest', async ({ I }) => {
  await bash.runCommand('gcloud config set project dcf-integration');
  const svcAccount = await bash.runCommand('gcloud config get-value account');
  const theCmd = `gen3 gcp-bucket-manifest create ${testBucket} ${svcAccount} $PWD/authz_mapping_${I.cache.UNIQUE_NUM}.tsv`;
  if (process.env.DEBUG === 'true') {
    console.log(`Running command: ${theCmd}`);
  }
  await bash.runCommand(theCmd);
  const triggerGCPBucketManifestGenerationJobOut = await bash.runCommand(theCmd);
  // parsing weird single line output similar to:
  //  ci-env-1-planx-pla-net-gcp-bucket-manifest-gly9NAME TYPE DATA AGE
  const jobIDFull = triggerGCPBucketManifestGenerationJobOut.slice(0, triggerGCPBucketManifestGenerationJobOut.indexOf('NAME'));
  const jobId = jobIDFull.split('-').slice(-1)[0];
  console.log(`gen3 bucket-manifest process initiated, here is the full job id: ${jobIDFull}. Waiting for infrastructure provisioning...`);
  console.log(`short jobId: ${jobId}`);

  await sleepMS(20000);
  await checkPod(I, 'google-bucket-manifest', 'gen3job', params = { nAttempts: 100, ignoreFailure: false, keepSessionAlive: true }); // eslint-disable-line no-undef

  const bucketManifestList = await bash.runCommand(`
    gen3 gcp-bucket-manifest list | xargs -i echo "{} "
  `);
  if (process.env.DEBUG === 'true') {
    console.log(`bucketManifestList: ${bucketManifestList}`);
  }
  // looks like this gen3 gcp-bucket-manifest create operation creates two job ids
  if (bucketManifestList.trim().split(' ').length > 2) {
    throw new Error(`ERROR: Found more than two jobIds on namespace ${process.env.KUBECTL_NAMESPACE}.`);
  }

  expect(triggerGCPBucketManifestGenerationJobOut).to.not.to.be.empty;
  expect(expectedMetadataForAssertions).to.not.to.be.empty;

  const tempBucketName = `gs://${process.env.KUBECTL_NAMESPACE}-planx-pla-net-gcp-bucket-manifest-${jobId}_temp_bucket`;

  const listContentsOfTempBucketRaw = await bash.runCommand(`
    gsutil ls ${tempBucketName} | grep manifest_
  `);
  if (process.env.DEBUG === 'true') {
    console.log(`listContentsOfTempBucketRaw: ${listContentsOfTempBucketRaw}`);
  }
  await bash.runCommand(`
    gsutil cp ${listContentsOfTempBucketRaw} .
  `);

  const bucketManifestFile = listContentsOfTempBucketRaw.split('/').slice(-1)[0];

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
      if (process.env.DEBUG === 'true') {
        console.log(
          `Running assertion for ${files[i]} (index: ${i}) - TSV header: ${assertionKey}...`,
        );
      }
      const assertionFailureMsg = `The ${assertionKey} in the bucket manifest doesn't match expected value for the ${files[i]}.`;
      expect(
        bucketManifestTSV[i][assertionKey],
        assertionFailureMsg,
      ).to.be.equal(expectedMetadataForAssertions[files[i]][assertionKey]);
    });
  }
});
