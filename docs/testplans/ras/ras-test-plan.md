# Test plan for Gen3's implementation of Researcher Auth Services (RAS)

## One-liner overview of the service
The Resercher Auth Services (RAS) is an implementation of the Global Alliance for Genomics & Health (GA4GH) Passport Specifications ([https://github.com/ga4gh-duri/ga4gh-duri.github.io/blob/master/researcher_ids/ga4gh_passport_v1.md](https://github.com/ga4gh-duri/ga4gh-duri.github.io/blob/master/researcher_ids/ga4gh_passport_v1.md)). It defines a common process for Authentication, Authorization and Logging around NIH's open and controlled data assets and repositories. This test plan focuses on the Gen3 implementation of such spec.
More info:  ([https://auth.nih.gov/docs/RAS/serviceofferings.html](https://auth.nih.gov/docs/RAS/serviceofferings.html))

## Environmental dependencies
In order to execute this test, the environment must have the following items fully configured:
- Latest fence version with the RAS HTTP API endpoints
- A number of test users with their corresponding permissions (as per the table found in the next section). These test accounts must be long-living accounts in the dev tier so we can use for continuous integration and ongoing testing.

## Test Plan

The initial coverage comprises the following scenarios described in the testing matrix of users, access and assertions:

:information_source: Due to the hard dependency on external entities (e.g., Fence will communicate with RAS, a passport / visa assertion repository, to validate authN/authZ visas), in this first iteration, the tests will follow a semi-automated approach through executable tests (later we should mock the 3rd party services and work with dummy data).

### Testing matrix

Each Account Type should be a separate User / Login.
The test scenarios should iterate through the list of accounts, impersonate each of them and try to instrument a given open access or controlled data record (e.g., PreSignedURL test) to verify results against the test assertions.

| Account Type                       | Access (RAS Visas)                                                                            | Expected Behavior                                                                                            |
| ---------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Account Exists / No Visas          | User Account has no RAS Issued Visas but the account exists                                   | - This user can still access open access data in DCF<br>- No access to controlled access data                |
| Account Exists / Open Access Visas | User Account has RAS issued Visas granting access to PHS IDs referencing open access projects | - This user can still access open access data in DCF<br>- No access to controlled access data                |
| Account Exists / Some Visas        | User Account has access to at least one mock controlled access data set                       | - This user can access open access data.<br>- This user can access allowed controlled access to some PHS IDs |
| Account Exists / All Visas         | User Account has visas to all set of mock PHS IDs we have available for testing               | - This user can access open access data.<br>- This user can access all controlled access data to PHS IDs     |
| Account Exists / Invalid Visas     | User Account exists but contains Visas that are not signed by RAS                             | - User can login through RAS but has no access to controlled access data.                                    |
| Account Exists / Valid Visa with consent code reference     | User Account has access to controlled access data with a consent code                             | - User can login through RAS and access specific controlled access data based on the consent code.                                    |

The test plan assumes the presence of all these accounts (as opposed to mutating access during the tests' execution and making the process too time-consuming).

## Load Tests
### Performance benchmarking
- Include a new K6 script to perform ad-hoc load testing and verify how the RAS endpoints / transactions scale with a surge of requests. Criteria:
*   http_req_duration: avg<1000, p(95)<2000
*   failed_requests: rate<0.05
*   virtual_users: <ramping up from 0 to 50 users in ~10 mins and keep the surge of requests for a couple of min>
### Auto-scaling config
min: 2, max: 5

