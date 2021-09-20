# Test plan for Gen3's Visa Update

## One-liner overview of the service
This Kubernetes cronjob will run every hour to continuously update GA4GH RAS passports/visas.


## Environmental dependencies
In order to execute this test, the environment must have the following items fully configured:
- Latest fence version with the latest RAS M2 changes (version: TBD)
- Include the following in fence-config.yaml:
```
# Settings for usersync with visas
USERSYNC:
  sync_from_visas: true
```

## Test Plan

The test comprises the following steps:

 1. Login as one of the RAS Staging users (e.g., `UCtestuser128`). *_This login transaction populates a database table and makes this user eligible for continuous passport updates_.
 2. Obtain passport information from `/user/user` (decode the `ga4gh_passport_v1` JWT).
 3. Run the Visa Update k8s job (`gen3 job run fence-visa-update-cronjob`). *_this should dump new visa info into the database, which will only be applied in a subsequent usersync cycle_.
 4. Run the Usersync k8s job (`gen3 job run usersync`).
 5. Assertion: The passport info MUST be updated by the usersync run. Check timestamps, etc.

## Load Tests
 - N/A
