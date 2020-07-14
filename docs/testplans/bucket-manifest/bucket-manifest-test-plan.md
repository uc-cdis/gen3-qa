# Bucket Manifest Generation

## Overview of the service
The Bucket Manifest Generation feature is a Gen3 CLI command that initiates a background operation to produce an Indexd-compatible indexing manifest based on the files found in a given storage bucket. The tool targets one AWS S3 or Google Storage bucket, provisions the required infrastructure and downloads each file to calculate their size and md5 hash through AWS/Google batch computation. The information associated with each file is stored into a manifest that is uploaded to a temporary bucket (to be downloaded by the environment's administrator later on).

This facilitates the indexing of a given bucket that already contains clinical files that must be mapped by Indexd in a target Gen3 Commons environment.
## How to use
From the Admin VM, an environment administrator can trigger the utility through the Gen3 CLI:
```bash
gen3 bucket-manifest create my-test-bucket
```
## Tests
The initial coverage comprises the following scenarios:
### Positive test
1. Run the `gen3 bucket-manifest` utility against a test bucket containing one small file (`1kb`) and one slightly bigger file (`5mb`). The test should also feed another argument containing an `authz` mapping file that should be used by the tool to correlate the urls (file path within the bucket) with the authentication instruction and inject this information as an additional TSV column in the final manifest.
_To facilitate the test a custom command has been created (`create-jenkins`) to augment the existing `create` logic and produce a `paramFile.json` file containing the temporary bucket name that should host the resulting manifest_.
2. The test logic should run some polling logic to verify if the ephemeral `bucket-manifest` k8s pod completes its task and also make sure the resulting manifest file can be found in the temporary bucket.
3. Finally, run assertions against the output.
The test bucket and its files should contain data that must be previously mapped / hardcoded in the test logic, the assertions should make sure the manifest contains matching urls, size, md5 and authz information.

### Negative test
- N/A
