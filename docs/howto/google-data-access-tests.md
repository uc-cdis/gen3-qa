# A guide to writing integration tests for the Google Data Access features

To set up a dev environment for Google tests, follow [this guide](https://github.com/uc-cdis/cdis-wiki/blob/master/dev/gen3/guides/gen3qa-dev-env.md#fence-configuration-for-google-tests).

## Assertions

When an assertion fails, the rest of the test is not executed. When writing Google tests, it is important that we leave the environment (fence DB and Google projects) clean so that the following tests can run normally. This is why each of the current Google tests is organised in 3 main parts:
1. Test. Instead of checking the results right away, save them.
2. Clean up. Undo any changes to the environment that could interfere with other tests. For example, delete temporary Service Accounts keys.
3. Assertions. Finally, check the validity of the results.

## Google projects and service accounts

### Existing setup

| Google project name      | Owner                   | Reference in the tests              | Purpose |
|--------------------------|-------------------------|-------------------------------------|---------|
| dcf-integration          | planx-pla.net           |                                     | Owns buckets dcf-integration-qa and dcf-integration-test |
| SimpleProjectAlpha       | gen3.autotest@gmail.com | googleProjectA                      | Valid project |
| ProjectWithComputeAPI    | gen3.autotest@gmail.com | googleProjectWithComputeServiceAcct | Valid project |
| ProjectWithComputeAPI    | gen3.autotest@gmail.com | googleProjectWithInvalidServiceAcct | Used to test invalid SA registration |
| planxparentproject       | dummy-one@example.org | googleProjectWithParentOrg          | Used to test invalid SA registration |
| projectfencenoaccess     | gen3.autotest@gmail.com | googleProjectFenceNotRegistered     | Used to test invalid SA registration |
| ProjectServiceAcctHasKey | gen3.autotest@gmail.com | googleProjectServiceAcctHasKey      | Used to test invalid SA registration |
| Gen3QA-[namespace]       | gen3.autotest@gmail.com | googleProjectDynamic                | See "Notes on googleProjectDynamic" section |

| Service account                                                 | Purpose |
|-----------------------------------------------------------------|---------|
| fence-service@dcf-integration.iam.gserviceaccount.com           | Fence monitor. Needs "Editor" and "Project IAM Admin" permissions on the Google projects |
| gen3qa-service@gen3qa-validationjobtest.iam.gserviceaccount.com | Service account used by the tests to interact with the Google projects. It has access to everything |
| service-account@gen3qa-[namespace].iam.gserviceaccount.com      | Represents a researcher's project SA for "registering" for controlled access data through Gen3. Each googleProjectDynamic has one |

### Notes on googleProjectDynamic

Most Google projects that have been set up for testing purposes are not modified by the tests.  However, some tests require modifying the Google project itself (service account external key creation/deletion, permission updates...). If several of these tests are running simultaneously, they will make each other fail - for example, if a test generates an external key for a service account, other tests will not be able to register service accounts in the same Google project.

All the tests that require exclusive access to a Google Project use the same project: `googleProjectDynamic`. Each Jenkins environment has its own "dynamic project" that it has exclusive access to. During the test setup, we make sure to reset this project to what it should be before the tests modify it.

When setting up a new Jenkins environment, we need to set up a new Google project:
* Create a new Google project owned by `gen3.autotest@gmail.com`. Name: `Gen3QA-[namespace]` (for example, "Gen3QA-jenkins-dcp"). Select "No organisation".
* In "IAM", give `Owner` role to `gen3qa-service@gen3qa-validationjobtest.iam.gserviceaccount.com`.
* In "Service Accounts", create a service account with name and id `service-account`. Optional description: `Used by the gen3-qa integration tests - represents an external user's SA`.

The dev environments share the dynamic project `Gen3QA-ValidationJobTest`. If a single project is not enough for several developers running Google tests at the same time, create a new project `Gen3QA-ValidationJobTest2` by following the steps above, change the namespace to use in `setupGoogleProjectDynamic()` and update this documentation.
