pre-requisites:
-- 
0. Unlink your google account
# What needs to be done here ->
  a. hit the endpoint - DEL <hostname>/user/link/google and pass your NIH access token as auth
  
1. Google (`<user>@uchicago.edu` entry in users.yaml) & NIH access to the environment.
# What needs to be done here ->
  a. Add the google account that you are going to use for GCP account and linking process in the useryaml

2. Google Cloud Platform (GCP) account (outside the PlanX Org, i.e., simulating a customer account).
3. An _outsider_ Google account that owns the _customer_ GCP account.
4. A `fence-service` account must be added as _editor_ to IAM (with permissions to scan accounts).
5. A New _customer_ service account must be created so it can be linked as part of the test flow.
# What needs to be done here ->
  a. Go to GCP console - login with whatever outside google account you want to Link to google - create project "Blah" -> Under IAM, you see account name as owner
  b. Login with your NIH account - hit the end point <hostname>/user/google/service_accounts/monitor - get the service-account name
  c. go back to google project you created -> IAM -> "ADD" as new service account with permission EDITOR + Security Admin
  d. go back to commons - <hostname>/user/link/google?redirect=/login and redirect you to choose the google account to link with google - select the one which you logged in with in GCP while creating a GCP Project on console
  e. login back with your NIH account and you would see service_account in your token with one which you linked in previous step

6. Existing files (successfully uploaded and indexed). A portion of these files must have a proper ACL configuration for both Google & NIH accounts, some files need to have an ACL versus Project Access mismatch to test _Access Denied_ scenarios.
# What needs to be done here ->
  a. create a manifest and index the records
  
7. Client ID provided by developers (required for OIDC bootstrapping).
8. Client Secret provided by developers (Used for basic auth to obtain tokens and to refresh the access token).
# What needs to be done here ->
  a. need to get client_id and client_secret
  
