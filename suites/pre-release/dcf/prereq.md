pre-requisites:
-- 
1. Google (`<user>@uchicago.edu` entry in users.yaml) & NIH access to the environment.
2. Google Cloud Platform (GCP) account (outside the PlanX Org, i.e., simulating a customer account).
3. An _outsider_ Google account that owns the _customer_ GCP account.
4. A `fence-service` account must be added as _editor_ to IAM (with permissions to scan accounts).
5. A New _customer_ service account must be created so it can be linked as part of the test flow.
6. Existing files (successfully uploaded and indexed). A portion of these files must have a proper ACL configuration for both Google & NIH accounts, some files need to have an ACL versus Project Access mismatch to test _Access Denied_ scenarios.
7. Client ID provided by developers (required for OIDC bootstrapping).
8. Client Secret provided by developers (Used for basic auth to obtain tokens and to refresh the access token).
