# Metadata Ingestion test plan

## One-liner overview of the service
The Metadata Ingestion is a background batch process, powered by a Python script that runs as a Sower Job (ephemeral k8s pod), to fetch data from dbGaP and create clinical metadata records within the Metadata Service blobstore.

## Test Plan

The initial coverage comprises the following scenarios:

### Positive test

Mock the NIH/dbGaP HTTP endpoint to provide fictitious data.
The test setup can instrument the underlying k8s configmaps of the sower jobs and alter the environment variables of the sower job's pod, feeding test data to the metadata ingestion job by overriding the `DBGAP_STUDY_ENDPOINT` parameter (i.e., simulating the data that is retrieved from dbGaP).
The `metadata-manifest-ingestion` sower-job ([https://github.com/uc-cdis/sower-jobs](https://github.com/uc-cdis/sower-jobs)) executes the `dbgap_extract.py` script ([https://github.com/uc-cdis/dbgap-extract](https://github.com/uc-cdis/dbgap-extract)). This script will retrieve mock data to be processed by the system and validated by the test assertions.
```
REQUEST_URL = os.environ.get('DBGAP_STUDY_ENDPOINT', 'https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/GetSampleStatus.cgi?study_id={}&rettype=xml')
```

### Negative test

Set an invalid `study_accession` and make sure the job does not retrieve any data.
