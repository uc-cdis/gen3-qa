/*
 Metadata Ingestion Sower Jobs (PXP-6276)
 This test plan has a few pre-requisites:
 1. Sower must be deployed and
 2. The environment's manifest must have the indexing jobs declared
    within the sower config block (ingest-metadata-manifest & get-dbgap-metadata)
 3. Metadata Service (mds) must also be deployed
*/
Feature('Metadata Ingestion');

const { expect } = require('chai');
const { checkPod, sleepMS, Gen3Response } = require('../../utils/apiUtil.js');
const { Bash } = require('../../utils/bash.js');

const bash = new Bash();

const testGUID = '95a41871-222c-48ae-8004-63f4ed1f0691';
const testTSVURL = 'https://cdis-presigned-url-test.s3.amazonaws.com/test-study-subject-id.tsv';
const testDbGaPURL = 'https://cdis-presigned-url-test.s3.amazonaws.com/test-dbgap-mock-study.xml';
const testCSVToMergeWithStudyXML = 'https://cdis-presigned-url-test.s3.amazonaws.com/test-dbgap-mock-study.csv'

const expectedResult = {
  sra_sample_id: 'SRS1361261',
};

BeforeSuite(async (I, users) => {
  console.log('Setting up dependencies...');
  I.cache = {};
  I.cache.UNIQUE_NUM = Date.now();

  const setupTestingArtifacts = bash.runCommand(`
    mkdir metadata-ingestion-${I.cache.UNIQUE_NUM};
    mkdir metadata-ingestion-backup-${I.cache.UNIQUE_NUM};
    g3kubectl get cm manifest-sower -o json | jq -r .data.json > metadata-ingestion-backup-${I.cache.UNIQUE_NUM}/json
  `);
  console.log(`setupTestingArtifacts: ${setupTestingArtifacts}`);

  console.log('deleting existing metadata entries...');
  await I.sendDeleteRequest(
    `/mds-admin/metadata/${testGUID}`,
    users.indexingAcct.accessTokenHeader,
  ).then((res) => new Gen3Response(res));
});

AfterSuite(async (I) => {
  console.log('cleaning up test artifacts...');
  const recreateSowerConfigMap = bash.runCommand(`g3kubectl delete cm manifest-sower; g3kubectl create configmap manifest-sower --from-file=metadata-ingestion-backup-${I.cache.UNIQUE_NUM}/json; rm -Rf metadata-ingestion-backup-${I.cache.UNIQUE_NUM}; rm -Rf metadata-ingestion-${I.cache.UNIQUE_NUM}`);
  console.log(`recreateSowerConfigMap: ${recreateSowerConfigMap}`);
});

// Scenario #1 - Instrument sower HTTP API endpoint to trigger the ingest-metadata-manifest job
// and check if the expected mds entry is created successfully
Scenario('Dispatch ingest-metadata-manifest sower job with simple json and verify metadata ingestion @metadataIngestion', async (I, users) => {
  const sowerJobName = 'ingest-metadata-manifest';
  const dispatchJob1 = await I.sendPostRequest(
    '/job/dispatch',
    {
      action: sowerJobName,
      input: {
        URL: testTSVURL,
        metadata_source: 'dbgap',
        host: `https://${process.env.HOSTNAME}`,
      },
    },
    users.indexingAcct.accessTokenHeader,
  ).then((res) => res);
  expect(dispatchJob1, `Should have triggered the ${sowerJobName} sower job`).to.have.property('status', 200);

  await checkPod(sowerJobName);

  const nAttempts = 6;
  for (let i = 0; i < nAttempts; i += 1) {
    console.log(`Looking up the metadata entry... - attempt ${i}`);
    const mdsEntryRes = await I.sendGetRequest(
      `/mds/metadata/${testGUID}`,
    ).then((res) => new Gen3Response(res));

    if ('_guid_type' in mdsEntryRes.data) {
      expect(mdsEntryRes.data.dbgap.sra_sample_id).to.equal(`${expectedResult.sra_sample_id}`);
      break;
    } else {
      console.log(`WARN: The metadata entry has not been created yet... - attempt ${i}`);
      await sleepMS(5000);
      if (i === nAttempts - 1) {
        const metadataIngestionLogs = bash.runCommand('g3kubectl logs -l app=sowerjob');
        console.log(`${sowerJobName} logs: ${metadataIngestionLogs}`);
        throw new Error(`ERROR: The metadata ingestion operation failed. Response: ${JSON.stringify(mdsEntryRes.data)}`);
      }
    }
  }
}).retry(1);

// Scenario #2 - Instrument sower HTTP API endpoint to trigger the get-dbgap-metadata job
// pointing to a mock dbgap study file and check if the expected mds entry is created successfully
Scenario('Dispatch get-dbgap-metadata job with mock dbgap xml and verify metadata ingestion @metadataIngestion', async (I, users) => {
  const sowerJobName = 'get-dbgap-metadata';
  // TODO: Improve the dbgap script to consume a new DBGAP_STUDY_ENDPOINT url
  // from the job dispatch input parameter to simplify this override
  bash.runCommand(`g3kubectl get cm manifest-sower -o json | jq -r .data.json | jq -r --argjson dbgap_study_endpoint \'\\'\'[{ "name": "DBGAP_STUDY_ENDPOINT", "value": "${testDbGaPURL}" }]\'\\'\' \'\\'\'(.[] | select(.name == "${sowerJobName}") | .container.env) += $dbgap_study_endpoint\'\\'\' > metadata-ingestion-${I.cache.UNIQUE_NUM}/json`); // eslint-disable-line no-useless-escape
  const recreateSowerConfigMap = bash.runCommand(`g3kubectl delete cm manifest-sower; g3kubectl create configmap manifest-sower --from-file=metadata-ingestion-${I.cache.UNIQUE_NUM}/json`);
  console.log(`recreateSowerConfigMap: ${recreateSowerConfigMap}`);

  const dispatchJob2 = await I.sendPostRequest(
    '/job/dispatch',
    {
      action: sowerJobName,
      input: {
        phsid_list: 'phs123', // This will be ignored based on the DBGAP_STUDY_ENDPOINT override
        indexing_manifest_url: testCSVToMergeWithStudyXML,
        manifests_mapping_config: {
          guid_column_name: 'guid',
          row_column_name: 'submitted_sample_id',
        },
        partial_match_or_exact_match: 'partial_match',
      },
    },
    users.indexingAcct.accessTokenHeader,
  ).then((res) => res);
  expect(dispatchJob2, `Should have triggered the ${sowerJobName} sower job`).to.have.property('status', 200);

  await checkPod(sowerJobName);

  const nAttempts = 6;
  for (let i = 0; i < nAttempts; i += 1) {
    console.log(`Looking up the metadata entry... - attempt ${i}`);
    const mdsEntryRes = await I.sendGetRequest(
      `/mds/metadata/${testGUID}`,
    ).then((res) => new Gen3Response(res));

    if ('_guid_type' in mdsEntryRes.data) {
      // TODO: Set correct parameters to run assertions
      expect(mdsEntryRes.data.dbgap.sra_sample_id).to.equal(`${expectedResult.sra_sample_id}`);
      break;
    } else {
      console.log(`WARN: The metadata entry has not been created yet... - attempt ${i}`);
      await sleepMS(5000);
      if (i === nAttempts - 1) {
        const metadataIngestionLogs = bash.runCommand('g3kubectl logs -l app=sowerjob');
        console.log(`${sowerJobName} logs: ${metadataIngestionLogs}`);
        throw new Error(`ERROR: The metadata ingestion operation failed. Response: ${JSON.stringify(mdsEntryRes.data)}`);
      }
    }
  }
}).retry(1);
