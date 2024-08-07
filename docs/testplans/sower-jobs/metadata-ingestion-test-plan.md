# Metadata Ingestion test plan

## One-liner overview of the service
The Metadata Ingestion is a background batch process, powered by a Python script that runs as a Sower Job (ephemeral k8s pod), to fetch data from dbGaP and create clinical metadata records within the Metadata Service blobstore. There are two separate sower jobs:
- `ingest-metadata-manifest`
- `get-dbgap-metadata`

## Environmental dependencies
In order to execute this test, the environment must have the following items fully configured:
- Sower jobs (including the metadata ingestion jobs)
- Metadata service
- A test user with the required permissions (arborist policies: sower, mds_admin, indexd_admin) -- A user has already been created for this purpose: `ctds.indexing.test@gmail.com`.

## How to dispatch and retrieve the output from Sower jobs
These Sower jobs can be dispatched with requests to the Sower endpoint (`/job/dispatch`), such as:
```bash
% curl -X POST "https://${GEN3_HOSTNAME}/job/dispatch" --header "Content-Type: application/json" \
--header "Authorization: Bearer ${ACCESS_TOKEN}" \
--data-raw '{ "action": "get-dbgap-metadata", "input": {
        "phsid_list": "phs123",
        "indexing_manifest_url": "https://cdis-presigned-url-test.s3.amazonaws.com/test-dbgap-mock-study.csv",
        "manifests_mapping_config": {
          "guid_column_name": "guid",
          "row_column_name": "submitted_sample_id",
          "indexing_manifest_column_name": "submitted_sample_id"
        },
        "partial_match_or_exact_match": "exact_match"
      }}'
```
*_The fictitious study `phs123` will be ignored if the REQUEST URL override is in place_
`STUDY_ENDPOINT="https://cdis-presigned-url-test.s3.amazonaws.com/test-dbgap-mock-study.xml"`

This request should produce a response containing an `uid`, e.g.:
```bash
› [Response] {"uid":"592f7076-ba54-11ea-9918-0ecfa8696edf","name":"get-dbgap-metadata-hjlbw","status":"Unknown"}
```

To obtain the output of the dispatched job, issue a `HTTP GET` request against the sower endpoint:
```bash
% curl -s -X GET 'https://${GEN3_HOSTNAME}/job/output?UID=592f7076-ba54-11ea-9918-0ecfa8696edf' --header 'Content-Type: application/json' --header "Authorization: Bearer ${ACCESS_TOKEN}"
```

*UPDATE:*
About the deletion endpoint: There is a recently-introduced behavior (`HTTP DELETE mds/objects/{guid}` -> introduced in PR https://github.com/uc-cdis/metadata-service/pull/20) that not only deletes the MDS entry from the database but it also deletes the underlying Indexd record. Therefore, to accommodate this flow, the test uploads a dummy file and creates a new MDS entry to later instrument the DELETION endpoint:
```
  const uploadTmpFile = await bash.runCommand(`
    echo "hello mds" > mds-test.file && aws s3 cp ./mds-test.file s3://cdis-presigned-url-test/mds-test.file
  `);
``` 

## Test Plan

The initial coverage comprises the following scenarios:

### Positive test

Mock the NIH/dbGaP HTTP endpoint to provide fictitious data.

The test setup can instrument the underlying k8s configmaps of the sower jobs and alter the environment variables of the sower job's pod, feeding test data to the metadata ingestion job by overriding the `DBGAP_STUDY_ENDPOINT` parameter (i.e., simulating the data that is retrieved from dbGaP).

The `metadata-manifest-ingestion` sower-job ([https://github.com/uc-cdis/sower-jobs](https://github.com/uc-cdis/sower-jobs)) executes the `dbgap_extract.py` script ([https://github.com/uc-cdis/dbgap-extract](https://github.com/uc-cdis/dbgap-extract)). This script will retrieve mock data to be processed by the system and validated by the test assertions.
```
REQUEST_URL = os.environ.get('DBGAP_STUDY_ENDPOINT', 'https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/GetSampleStatus.cgi?study_id={}&rettype=xml')
```

Once the mock data is obtained, the ingestion process will create metadata-service JSON docs and the test assertion should verify the existence of the JSON doc with the correct data.

- Scenario #1: Dispatch ingest-metadata-manifest sower job with simple TSV and verify metadata ingestion

- Scenario #2: Dispatch exact match get-dbgap-metadata job with mock dbgap xml, utilize resulting TSV to dispatch the ingest-metadata-manifest sower job and verify metadata ingestion

- Scenario #3: Dispatch partial match get-dbgap-metadata job with mock dbgap xml, utilize resulting TSV to dispatch the ingest-metadata-manifest sower job and verify metadata ingestion

- Scenario #4: Create a new mds entry and then issue http delete against mds/objects/{guid} 

### Negative tests

1. Set an invalid `study_accession` and make sure the job does not retrieve any data.

2. Deliberately pull a malformed XML file to see if the dbgap-extract script handles it properly.

### TODOs (improve coverage later)

- Check issues with authZ and/or authN
