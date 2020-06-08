# Metadata Ingestion test plan

## One-liner overview of the service
The Metadata Ingestion is a backgrouNd batch process, powered by a Python script that runs as a Sower Job (ephemeral k8s pod), to fetch data from dbGaP and create clinical metadata records within the Metadata Service blobstore.

## Environmental dependencies
In order to execute this test, the environment must have the following items fully configured:
- Sower jobs (including the metadata ingestion job)
- Metadata service
- A test user with the required permissions (arborist policies: sower, mds_admin, indexd_admin) -- A user has already been created for this purpose: `ctds.indexing.test@gmail.com`.

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

### Negative tests

1. Set an invalid `study_accession` and make sure the job does not retrieve any data.

2. Deliberately pull a malformed XML file to see if the dbgap-extract script handles it properly.

### TODOs (improve coverage later)

- Check issues with authZ and/or authN
