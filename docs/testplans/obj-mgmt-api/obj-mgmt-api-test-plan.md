# Object Management API (aka: Shepherd) test plan

## Overview of the service
The Object Management API is an augmentation of the metadata service (mds) that allows the user to manage objects in a data lake through an HTTP API interface. Its features comprise data uploading, indexing, retrieving and bookkeeping.
The main input flow is performed through the Gen3 CLI utility, which communicates with the Object Management API endpoint to upload a large file, create an Indexd record and map the file against a metadata service entry (which facilitates the discovery of any instance of clinical file or study metadata due to the nature of the JSON Blobstore). It also allows the user to submit requests for PreSigned URLs based on the GUID of the metadata entry.
## RESTful API
Here's one of its swagger pages:
[https://TBD](https://nci-crdc-staging.datacommons.io/mds/docs)
## Authentication
Users can interact with the Object Management API using a Gen3 Access Token, e.g.:
```bash
% curl -X GET 'https://${GEN3_HOSTNAME}/mds/api/v1/objects/{{GUID or ALIAS}}' \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer ${ACCESS_TOKEN}"
"record": { … indexd record for file upload … },
  "metadata": { 
    "_file_type": "PFB",
    "_resource_paths": ["/projects/FOO/programs/bar"],
    "_uploader_id": 42,
    "_upload_status": "completed",
  	"_bucket": "s3://gen3-bucket",
    … more metadata service info for GUID …
  }
}
```
## Tests
The initial coverage comprises the following scenarios:
1. Run the `gen3-cli` utility to upload a dummy file to target commons (Jenkins CI env) -- That should instrument the `POST /api/v1/objects/{{GUID or ALIAS}}` in the background.
2. Check if ssjdispatcher's indexing pod comes up in the background
3. Check if the Indexd record is created successfully and its `size` & `md5` info are correct.
4. Start polling logic to check if the metadata service record is created successfully (`GET /api/v1/objects/{{GUID or ALIAS}}`)
5. Make sure the same mds entry shows up with authz-based lookup (`GET /api/v1/objects/?resource_path=/programs/foo/*`)
6. Try to produce a PreSigned URL with a user whose policies are included in the authz of the mds entry & the Indexd record (`GET /api/v1/objects/{{GUID or ALIAS}}/download`)
7. Finally, delete the metadata service entry (`DELETE /api/v1/objects/{{GUID or ALIAS}}`) and run assertions to make sure the mds entry & the Indexd record no longer exist.
## Load Tests
TBD
### Auto-scaling config
min: 2, max: 5
