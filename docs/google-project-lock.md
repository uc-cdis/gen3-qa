# Google Project lock for integration tests

## Context

Most Google projects that have been set up for testing purposes are not modified by the tests.

However, some tests require making modifications to the Google project itself (service account external key creation/deletion, permission updates...). If several of these tests are running simultaneously, they will make each other fail - for example, if a test generates an external key for a service account, other tests will not be able to register service accounts in the same project.

## Solution

All the tests that require exclusive access to a Google Project in order to modify it will be using the same project: `googleProjectDynamic` (project id `gen3qa-validationjobtest`, owned by `gen3.autotest@gmail.com`), defined in the Fence service properties.

To make sure only one test is using this project at all times, we are using the following locking system:
- Before starting to modify the project, the test tries to lock it by calling `google.lockGoogleProject()`. The lock is a service account named `locked-by-test`: if it already exists, another test has aquired the lock and the current test will wait for the project to become available. The maximum waiting time is set to 3 minutes by default (because the current tests that use the lock should not take more than 3 minutes).
- When the test is done modifying the project, it unlocks it by calling `google.unlockGoogleProject()`. This function checks if the `locked-by-test` service account exists and if it does, attempts to delete it, which releases the lock.

The lock must always be released at the end of the tests! To be safe, `google.unlockGoogleProject()` should be called before/after each test in the test suites that use this feature. To make sure this does not remove the lock created by another testing session, a unique identifier is added to the lock service account name: the tests can only remove a lock that was placed by the current session (using the unique identifier), and they cannot lock the project if a lock exists (regardless of the unique identifier).
