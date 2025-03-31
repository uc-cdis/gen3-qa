/*
 Metadata Ingestion Sower Jobs (PXP-6276)
 This test plan has a few pre-requisites:
 1. Sower must be deployed and
 2. The environment's manifest must have the indexing jobs declared
    within the sower config block (ingest-metadata-manifest & get-dbgap-metadata)
 3. Metadata Service (mds) must also be deployed
*/
Feature('Metadata Ingestion @requires-sower @requires-metadata @requires-indexd');

const { expect } = require('chai');
const { checkPod, sleepMS } = require('../../utils/apiUtil.js');
const { Bash } = require('../../utils/bash.js');

const bash = new Bash();

const testTSVURL = 'https://cdis-presigned-url-test.s3.amazonaws.com/test-study-subject-id.tsv';
const testDbGaPURL = 'https://cdis-presigned-url-test.s3.amazonaws.com/test-dbgap-mock-study.xml'; // this is a copy of phs000200.v12.p3 with only 7 samples
const testCSVToMergeWithStudyXML = 'https://cdis-presigned-url-test.s3.amazonaws.com/test-dbgap-mock-study.csv';

const files = {
  allowed: {
    filename: 'mds-test.file',
    md5: '73d643ec3f4beb9020eef0beed440ad0',
    link: 's3://cdis-presigned-url-test/mds-test.file',
    authz: ['/programs/QA'],
    size: 9,
  },
};

const expectedResults = {
  ingest_metadata_manifest: {
    sra_sample_id: 'SRS1361261',
    testGUID: '95a41871-222c-48ae-8004-63f4ed1f0691',
  },
  get_dbgap_metadata: {
    tsv: 'ad3bf4ad-1063-4e1b-97b0-4a31b777bea7',
    testGUID: 'ad3bf4ad-1063-4e1b-97b0-4a31b777bea7',
    testGUIDForPartialMatch: '5f5682f8-be38-45bb-9390-294e2678336e', // csv entry with aws_uri = s3://cdis-presigned-url-test/test_824703_data
  },
};

async function doPolling(I, url, authHeader, expectedData, nAttempts, operationDescription) {
  let httpReq = '';
  for (let i = 0; i < nAttempts; i += 1) {
    console.log(`performing operation: ${operationDescription}... - attempt ${i}`);
    httpReq = await I.sendGetRequest(
      url,
      authHeader,
    );

    if (expectedData in httpReq.data && httpReq.data[expectedData] !== '') {
      break;
    } else {
      console.log(`WARN: The operation ${operationDescription} has not return the ${expectedData} yet... - attempt ${i}`);
      await sleepMS(10000);
      if (i === nAttempts - 1) {
        throw new Error(`ERROR: The operation ${operationDescription} failed. Response: ${JSON.stringify(httpReq.data)}`);
      }
    }
  }
  return httpReq.data;
}

async function checkMetadataServiceEntry(I, expectedResult, authHeader) {
  let mdsQuery = '';
  try {
    console.log('Step #5 - Check if metadata service entries are created');
    mdsQuery = await doPolling(
      I,
      `/mds/metadata/${expectedResult}`,
      authHeader,
      '_guid_type',
      18,
      'metadata ingestion',
    );
  } catch (e) {
    const jobLogs = bash.runCommand('g3kubectl logs -l app=sowerjob');
    if (process.env.DEBUG === 'true') {
      console.log(`sower job logs: ${jobLogs}`);
    }
    throw e;
  }
  expect(mdsQuery).to.not.be.null;
  return mdsQuery;
}

async function feedTSVIntoMetadataIngestion(I, fence, uid, authHeader, expectedResult) {
  await checkPod(I, 'get-dbgap-metadata', 'sowerjob');

  let jobOutput = ''; let jobLogsURL = ''; let preSignedURL = '';
  try {
    console.log('Step #2 - Obtain output of the job containing pre signed url with TSV (merged XML+CSV)');
    jobOutput = await doPolling(
      I,
      `/job/output?UID=${uid}`,
      authHeader,
      'output',
      6,
      'dbgap metadata merge',
    );
    [jobLogsURL, preSignedURL] = jobOutput.output.split(' ');
  } catch (e) {
    const jobLogs = await I.sendGetRequest(jobLogsURL, authHeader);
    if (process.env.DEBUG === 'true') {
      console.log(`'get-dbgap-metadata logs: ${JSON.stringify(jobLogs)}`);
    }
    throw e;
  }

  console.log('Step #3 - Fetch contents of the TSV');
  const preSignedURLOutput = await fence.do.getFileFromSignedUrlRes(preSignedURL);
  if (process.env.DEBUG === 'true') {
    console.log(`debug: ${preSignedURLOutput}`);
  }
  // TODO: Investigate why we are getting an invalid response for a valid PreSigned URL
  // preSignedURLOutput: "Could not get file contents from signed url response"
  // expect(preSignedURLOutput).to.include(expectedResults.get_dbgap_metadata.tsv);

  console.log('Step #4 - Dispatch an ingest-metadata-manifest job to convert the TSV into a metadata service entry');
  const sowerJobName = 'ingest-metadata-manifest';
  const dispatchJob = await I.sendPostRequest(
    '/job/dispatch',
    {
      action: sowerJobName,
      input: {
        URL: preSignedURL,
        metadata_source: 'dbgap',
        host: `https://${process.env.HOSTNAME}`,
      },
    },
    authHeader,
  );

  expect(
    dispatchJob,
    `Should have triggered the ${sowerJobName} sower job`,
  ).to.have.property('status', 200);

  await checkMetadataServiceEntry(I, expectedResult, authHeader);
}

BeforeSuite(async ({ I, users, indexd }) => {
  console.log('Setting up dependencies...');
  I.cache = {};
  I.cache.UNIQUE_NUM = Date.now();

  const setupTestingArtifacts = bash.runCommand(`
    mkdir metadata-ingestion-${I.cache.UNIQUE_NUM};
    mkdir metadata-ingestion-backup-${I.cache.UNIQUE_NUM};
    g3kubectl get cm manifest-sower -o json | jq -r .data.json > metadata-ingestion-backup-${I.cache.UNIQUE_NUM}/json;
    echo "result: $?"
  `);
  if (process.env.DEBUG === 'true') {
    console.log(`setupTestingArtifacts: ${setupTestingArtifacts}`);
  }

  // TODO: Improve the dbgap script to consume a new DBGAP_STUDY_ENDPOINT url
  // from the job dispatch input parameter to simplify this override
  const singleQuote = process.env.RUNNING_LOCAL === 'true' ? "\'\\'\'" : "'"; // eslint-disable-line quotes,no-useless-escape
  const injectEnvVarToSowerConfigMap = await bash.runCommand(`g3kubectl get cm manifest-sower -o json | jq -r .data.json | jq -r --argjson dbgap_study_endpoint ${singleQuote}[{ "name": "DBGAP_STUDY_ENDPOINT", "value": "${testDbGaPURL}" }]${singleQuote} ${singleQuote}(.[] | select(.name == "get-dbgap-metadata") | .container.env) += $dbgap_study_endpoint${singleQuote} > metadata-ingestion-${I.cache.UNIQUE_NUM}/json`); // eslint-disable-line no-useless-escape
  if (process.env.DEBUG === 'true') {
    console.log(`injectEnvVarToSowerConfigMap: ${injectEnvVarToSowerConfigMap}`);
  }
  const recreateSowerConfigMap = await bash.runCommand(`g3kubectl delete cm manifest-sower; g3kubectl create configmap manifest-sower --from-file=metadata-ingestion-${I.cache.UNIQUE_NUM}/json; gen3 roll sower`);
  if (process.env.DEBUG === 'true') {
    console.log(`recreateSowerConfigMap: ${recreateSowerConfigMap}`);
  }

  await sleepMS(5000);

  console.log('deleting existing metadata entries...');
  await I.sendDeleteRequest(
    `/mds-admin/metadata/${expectedResults.ingest_metadata_manifest.testGUID}`,
    users.indexingAcct.accessTokenHeader,
  );
  await I.sendDeleteRequest(
    `/mds-admin/metadata/${expectedResults.get_dbgap_metadata.testGUID}`,
    users.indexingAcct.accessTokenHeader,
  );
  await I.sendDeleteRequest(
    `/mds-admin/metadata/${expectedResults.get_dbgap_metadata.testGUIDForPartialMatch}`,
    users.indexingAcct.accessTokenHeader,
  );
});

AfterSuite(async ({ I }) => {
  try {
    console.log('cleaning up test artifacts...');
    const recreateSowerConfigMap = bash.runCommand(`g3kubectl delete cm manifest-sower; g3kubectl create configmap manifest-sower --from-file=metadata-ingestion-backup-${I.cache.UNIQUE_NUM}/json; rm -Rf metadata-ingestion-backup-${I.cache.UNIQUE_NUM}; rm -Rf metadata-ingestion-${I.cache.UNIQUE_NUM}`);
    if (process.env.DEBUG === 'true') {
      console.log(`recreateSowerConfigMap: ${recreateSowerConfigMap}`);
    }
  } catch (error) {
    console.log(error);
  }
});

Before(async ({ indexd }) => {
  console.log('populating indexd records...');
  // To test the deletion endpoint, the mds record entry needs to reference an indexd record
  // So let us create one
  await indexd.do.addFileIndices(Object.values(files));
});

// Scenario #1 - Instrument sower HTTP API endpoint to trigger the ingest-metadata-manifest job
// and check if the expected mds entry is created successfully
Scenario('Dispatch ingest-metadata-manifest sower job with simple tsv and verify metadata ingestion @metadataIngestion', async ({ I, users }) => {
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
  );

  expect(
    dispatchJob1,
    `Should have triggered the ${sowerJobName} sower job`,
  ).to.have.property('status', 200);

  await checkPod(I, sowerJobName, 'sowerjob');

  // Deliberately leaving the authHeader argument undefined
  // because the GET operation does not require auth
  const metadataServiceEntry = await checkMetadataServiceEntry(
    I,
    expectedResults.ingest_metadata_manifest.testGUID,
  );
  expect(metadataServiceEntry.dbgap.sra_sample_id).to.equal(`${expectedResults.ingest_metadata_manifest.sra_sample_id}`);
}).retry(1);

// Scenario #2 - Instrument sower HTTP API endpoint to trigger the get-dbgap-metadata job
// pointing to a mock dbgap study file and check if the expected mds entry is created successfully
Scenario('Dispatch exact match get-dbgap-metadata job with mock dbgap xml and verify metadata ingestion @metadataIngestion', async ({ I, users, fence }) => {
  const sowerJobName = 'get-dbgap-metadata';
  console.log(`Step #1 - Dispatch ${sowerJobName} job`);
  const dispatchJob2 = await I.sendPostRequest(
    '/job/dispatch',
    {
      action: sowerJobName,
      input: {
        phsid_list: 'phs123', // This will be ignored based on the DBGAP_STUDY_ENDPOINT override
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
  );

  expect(
    dispatchJob2,
    `Should have triggered the ${sowerJobName} sower job`,
  ).to.have.property('status', 200);
  const { uid } = dispatchJob2.data;

  await feedTSVIntoMetadataIngestion(
    I,
    fence,
    uid,
    users.indexingAcct.accessTokenHeader,
    expectedResults.get_dbgap_metadata.testGUID,
  );
}).retry(1);

// Scenario #3 - Instrument sower HTTP API endpoint to trigger the get-dbgap-metadata job again
// Try a partial match between the Study XML (submitted_sample_id) and the CSV (aws_uri)
// and check if the expected mds entry is created successfully
Scenario('Dispatch partial match get-dbgap-metadata job with mock dbgap xml and verify metadata ingestion @metadataIngestion', async ({ I, users, fence }) => {
  const sowerJobName = 'get-dbgap-metadata';
  console.log(`Step #1 - Dispatch ${sowerJobName} job`);
  const dispatchJob2 = await I.sendPostRequest(
    '/job/dispatch',
    {
      action: sowerJobName,
      input: {
        phsid_list: 'phs123', // This will be ignored based on the DBGAP_STUDY_ENDPOINT override
        indexing_manifest_url: testCSVToMergeWithStudyXML,
        manifests_mapping_config: {
          guid_column_name: 'guid',
          row_column_name: 'submitted_sample_id', // XML property to match (from the Study's samples)
          indexing_manifest_column_name: 'aws_uri', // CSV header to look for partial match
        },
        partial_match_or_exact_match: 'partial_match',
      },
    },
    users.indexingAcct.accessTokenHeader,
  );

  expect(
    dispatchJob2,
    `Should have triggered the ${sowerJobName} sower job`,
  ).to.have.property('status', 200);
  const { uid } = dispatchJob2.data;

  await feedTSVIntoMetadataIngestion(
    I,
    fence,
    uid,
    users.indexingAcct.accessTokenHeader,
    expectedResults.get_dbgap_metadata.testGUIDForPartialMatch,
  );
}).retry(1);

// Scenario #4 - Instrument the metadata-service DELETE endpoint
Scenario('create a new mds entry and then issue http delete against mds/objects/{guid} @metadataIngestion', async ({ I, users, mds }) => {
  // create a local small file to upload to test bucket.
  const uploadTmpFile = await bash.runCommand(`
    echo "hello mds" > mds-test.file && aws s3 cp ./mds-test.file s3://cdis-presigned-url-test/mds-test.file
  `);
  if (process.env.DEBUG === 'true') {
    console.log(`uploadTmpFile: ${uploadTmpFile}`);
  }

  const guidToBeDeleted = files.allowed.did;

  const createMdsEntryReq = await I.sendPostRequest(
    `/mds/objects/${guidToBeDeleted}`,
    {
      authz: files.allowed.authz,
      file_name: files.allowed.filename,
      metadata: expectedResults.ingest_metadata_manifest,
    },
    users.indexingAcct.accessTokenHeader,
  );
  if (process.env.DEBUG === 'true') {
    console.log(`createMdsEntryReq status: ${createMdsEntryReq.status}`);
  }
  expect(
    createMdsEntryReq,
    'Creation request did not return a http 201. Check mds logs tarball archived in Jenkins',
  ).to.have.property('status', 201);

  console.log(`Step #4 - send http delete to mds/objects/${guidToBeDeleted}`);
  const deleteReq = mds.do.deleteMetadataObject(users.indexingAcct.accessTokenHeader, guidToBeDeleted);
  expect(deleteReq, 'Deletion request was unsuccessful').to.be.true;

  // Make sure the GUID no longer exists in the json blobstore
  const httpReq = await I.sendGetRequest(
    `/mds/metadata/${guidToBeDeleted}`,
    users.indexingAcct.accessTokenHeader,
  );

  expect(
    httpReq,
    `Should have deleted the ${guidToBeDeleted} entry`,
  ).to.have.property('status', 404);
}).retry(1);
