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
const testCSVToMergeWithStudyXML = 'https://cdis-presigned-url-test.s3.amazonaws.com/test-dbgap-mock-study.csv';

const expectedResults = {
  ingest_metadata_manifest: {
    sra_sample_id: 'SRS1361261',
  },
  get_dbgap_metadata: {
    tsv: 'ad3bf4ad-1063-4e1b-97b0-4a31b777bea7',
  },
};

async function doPolling(I, url, authHeader, expectedData, nAttempts, operationDescription) {
  let httpReq = '';
  for (let i = 0; i < nAttempts; i += 1) {
    console.log(`performing operation: ${operationDescription}... - attempt ${i}`);
    httpReq = await I.sendGetRequest(
      url,
      authHeader,
    ).then((res) => new Gen3Response(res));

    if (expectedData in httpReq.data && httpReq.data[expectedData] !== '') {
      break;
    } else {
      console.log(`WARN: The operation ${operationDescription} has not return the ${expectedData} yet... - attempt ${i}`);
      await sleepMS(10000);
      if (i === nAttempts - 1) {
        throw new Error(`ERROR: The operation ${operationDescription} failed. Response: ${httpReq.data}`);
      }
    }
  }
  return httpReq.data;
}

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
/*
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

  let jobOutput = '';
  try {
    jobOutput = await doPolling(I, `/mds/metadata/${testGUID}`, users.indexingAcct.accessTokenHeader, '_guid_type', 6, 'metadata ingestion');
  } catch (e) {
    const jobLogs = bash.runCommand('g3kubectl logs -l app=sowerjob');
    console.log(`${sowerJobName} logs: ${jobLogs}`);
    throw e;
  }
  expect(jobOutput.dbgap.sra_sample_id).to.equal(`${expectedResults.ingest_metadata_manifest.sra_sample_id}`);
}).retry(1);*/


// Scenario #2 - Instrument sower HTTP API endpoint to trigger the get-dbgap-metadata job
// pointing to a mock dbgap study file and check if the expected mds entry is created successfully
Scenario('Dispatch get-dbgap-metadata job with mock dbgap xml and verify metadata ingestion @metadataIngestion', async (I, users, fence) => {
  let sowerJobName = 'get-dbgap-metadata';
  // TODO: Improve the dbgap script to consume a new DBGAP_STUDY_ENDPOINT url
  // from the job dispatch input parameter to simplify this override
  bash.runCommand(`g3kubectl get cm manifest-sower -o json | jq -r .data.json | jq -r --argjson dbgap_study_endpoint \'\\'\'[{ "name": "DBGAP_STUDY_ENDPOINT", "value": "${testDbGaPURL}" }]\'\\'\' \'\\'\'(.[] | select(.name == "${sowerJobName}") | .container.env) += $dbgap_study_endpoint\'\\'\' > metadata-ingestion-${I.cache.UNIQUE_NUM}/json`); // eslint-disable-line no-useless-escape
  const recreateSowerConfigMap = bash.runCommand(`g3kubectl delete cm manifest-sower; g3kubectl create configmap manifest-sower --from-file=metadata-ingestion-${I.cache.UNIQUE_NUM}/json; gen3 roll sower`);
  console.log(`recreateSowerConfigMap: ${recreateSowerConfigMap}`);

  await sleepMS(5000);

  console.log('Step #1 - Dispatch get-dbgap-metadata job');
  const dispatchJob2 = await I.sendPostRequest(
    '/job/dispatch',
    {
      action: sowerJobName,
      input: {
        phsid_list: 'phs000200.v12.p3', // This will be ignored based on the DBGAP_STUDY_ENDPOINT override
        indexing_manifest_url: testCSVToMergeWithStudyXML,
        manifests_mapping_config: {
          guid_column_name: 'guid',
          row_column_name: 'submitted_sample_id', // XML property to match (from the Study's samples)
          indexing_manifest_column_name: 'submitted_sample_id', // CSV header to match (from indexing manifest)
        },
        partial_match_or_exact_match: 'exact_match',
      },
    },
    users.indexingAcct.accessTokenHeader,
  ).then((res) => res);
  expect(dispatchJob2, `Should have triggered the ${sowerJobName} sower job`).to.have.property('status', 200);

  const { uid } = dispatchJob2.data;

  await checkPod(sowerJobName);

  await sleepMS(8000);

  let jobOutput = ''; let jobLogsURL = ''; let preSignedURL = '';
  try {
    console.log('Step #2 - Obtain output of the job containing pre signed url with TSV (merged XML+CSV)');
    jobOutput = await doPolling(I, `/job/output?UID=${uid}`, users.indexingAcct.accessTokenHeader, 'output', 6, 'dbgap metadata merge');
    [jobLogsURL, preSignedURL] = jobOutput.output.split(' ');
  } catch (e) {
    const jobLogs = await I.sendGetRequest(jobLogsURL, users.indexingAcct.accessTokenHeader)
      .then((res) => new Gen3Response(res));
    console.log(`${sowerJobName} logs: ${JSON.stringify(jobLogs)}`);
    throw e;
  }

  console.log('Step #3 - Fetch contents of the TSV');
  const preSignedURLOutput = await fence.do.getFileFromSignedUrlRes(preSignedURL);
  console.log(`debug: ${preSignedURLOutput}`);
  //expect(preSignedURLOutput).to.include(expectedResults.get_dbgap_metadata.tsv);

  console.log('Step #4 - Dispatch an ingest-metadata-manifest job to convert the TSV into a metadata service entry');
  sowerJobName = 'ingest-metadata-manifest';
  const dispatchJob3 = await I.sendPostRequest(
    '/job/dispatch',
    {
      action: sowerJobName,
      input: {
        URL: preSignedURL,
        metadata_source: 'dbgap',
        host: `https://${process.env.HOSTNAME}`,
      },
    },
    users.indexingAcct.accessTokenHeader,
  ).then((res) => res);
  expect(dispatchJob3, `Should have triggered the ${sowerJobName} sower job`).to.have.property('status', 200);

  let jobOutput2 = '';
  try {
    console.log('Step #5 - Check if metadata service entries are created');
    jobOutput2 = await doPolling(I, `/mds/metadata/${expectedResults.get_dbgap_metadata.tsv}`, users.indexingAcct.accessTokenHeader, '_guid_type', 6, 'metadata ingestion');
  } catch (e) {
    const jobLogs = bash.runCommand('g3kubectl logs -l app=sowerjob');
    console.log(`${sowerJobName} logs: ${jobLogs}`);
    throw e;
  }
  expect(jobOutput2).to.not.be.null;
});
