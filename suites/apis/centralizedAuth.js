Feature('CentralizedAuth');
/*
Test sponsor use cases for Gen3 centralized authorization with new RBAC system:

1) As the maintainer of a data node in DCF, we want to grant permissions to submitters to
   create/retrieve/update/delete records in the centralized IndexD under our own namespace,
   so that they could do this on their own without touching other data in the same IndexD.

2) As the maintainer of DCF, we want to grant permissions to data node users to download
   only data for that data node through the centralized Fence, so that the same Fence can
   safely serve data from multiple data nodes with proper permission control.

3) As the owner of a client to Fence, or a user of a client to Fence, I want to retrieve
   user access from the user info endpoint and from the ID token, so my users can see all
   the permissions they have, including RBAC information.

4) As the owner of Kids First, I want to be able to specify AND logic in record ACLs,
   e.g. C1 AND C2 AND C3 where Cn is a project, in order to guarantee that the person
   accessing some family-based files from multiple biospecimens has all of the consents.

---

1) - Test that user without policies can't CRUD records in /gen3 or /abc

   - Test user with `abc-admin` policy, test creating record, reading record, updating
     record, and deleting in indexD with rbac /abc (should work),
     make sure they still can't create, read, update OR delete in /gen3

   - Test the same thing as above, but use a client's access_token for that user

2) - Test client-abc creating signed urls for data under /abc, ensure they cannot create
     signed urls for data under /gen3. Ensure that successful signed urls actually
     allow reading data.

   - Test that a user with `abc-admin` can create signed urls with their own access_token

3) - Test client flow to get id_token, compare to what's in userinfo endpoint, ensure
     RBAC policy information is there
        > NOTE: there is an existing test that might satisfy this with a few updates

4) - Create some records in indexd with AND logic, have client-abc try to create signed
     url for file for user that does NOT have necessary permissions, ensure failure.

   - Same as above but user DOES have permissions. Ensure successfull signed URL that
     we can access data with

   - Same as above two tests but with OR logic


We probably want some tests to make sure that after usersyncing and changing a user's
policies, they can no longer create signed urls?

dbgap syncing tests would be good too (since all these rely on user.yaml)

---

Create client-abc with `abc-admin` policy (CRUD under /abc)

cdis.autotest@gmail.com
    - abc-admin

dummy-one@planx-pla.net
    - abc.programs.test_program.projects.test_project1-viewer

smarty-two@planx-pla.net
    - abc.programs.test_program2.projects.test_project3-viewer
*/
const { Commons } = require('../../utils/commons.js');
const chai = require('chai');
const { Bash } = require('../../utils/bash.js');
const apiUtil = require('../../utils/apiUtil.js');

const bash = new Bash();

const fs = require('fs');

const I = actor();

/*
for twoProjectsFile, user needs to have ONLY these policies:
    - abc.programs.test_program.projects.test_project1-viewer
    - abc.programs.test_program2.projects.test_project3-viewer

for oneProjectOrOtherFile, two users. Each has ONE of these policies:
    - abc.programs.test_program.projects.test_project1-viewer
    - abc.programs.test_program2.projects.test_project3-viewer
*/
const indexed_files = {
  abcFooBarFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad0',
    rbac: '/abc/foo/bar',
    size: 9,
  },
  gen3TestTestFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad1',
    rbac: '/gen3/programs/test/projects/test',
    size: 10,
  },
  twoProjectsFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad0',
    rbac: '/abc/programs/test_program/projects/test_project1 AND /abc/programs/test_program2/projects/test_project3',
    size: 9,
  }
  oneProjectOrOtherFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad0',
    rbac: '/abc/programs/test_program/projects/test_project1 OR /abc/programs/test_program2/projects/test_project3',
    size: 9,
  }
}

// TODO remove all the _'s to actually run this stuff

_BeforeSuite(async (fence, users, indexd) => {
  console.log('Adding indexd files used to test signed urls');
  const ok = await indexd.do.addFileIndices(Object.values(indexed_files));
  chai.expect(
    ok, 'unable to add files to indexd as part of centralizedAuth setup').to.be.true;
});

_AfterSuite(async (fence, indexd, users) => {
  console.log('Removing indexd files used to test signed urls');
  await indexd.do.deleteFileIndices(Object.values(indexed_files));
});

_After(async (fence, users) => {
  // Cleanup after each scenario
});


_Scenario('centralized auth @rbac',
  async (fence, indexd, users, files) => {
  // do stuff
  // console.log('Use User0 to create signed URL for file in QA')
  // const User0signedUrlQA1Res = await fence.do.createSignedUrlForUser(
  //   indexed_files.qaFile.did, users.user0.accessTokenHeader);
  // let User0signedUrlQA1FileContents = await fence.do.getGoogleFileFromSignedUrlRes(
  //   User0signedUrlQA1Res);
});

/*
   - Test that user without policies can't CRUD records in /gen3 or /abc
*/
_Scenario('User without policies cannot CRUD indexd records in /gen3 or /abc @rbac',
  async (fence, indexd, users, files) => {
  // do stuff
});

/*
   - Test user with `abc-admin` policy, test creating record, reading record, updating
     record, and deleting in indexD with rbac /abc (should work),
     make sure they still can't create, read, update OR delete in /gen3
*/
_Scenario('User with access can CRUD indexd records in namespace, not outside namespace @rbac',
  async (fence, indexd, users, files) => {
  // do stuff
});

/*
   - Test the same thing as above, but use a client's access_token for that user
*/
_Scenario('Client with user token with access can CRUD indexd records in namespace, not outside namespace @rbac',
  async (fence, indexd, users, files) => {
  // do stuff
});

/*
   - Test client-abc creating signed urls for data under /abc, ensure they cannot create
     signed urls for data under /gen3. Ensure that successful signed urls actually
     allow reading data.
*/
_Scenario('Client with user token with access can create signed urls for records in namespace, not outside namespace @rbac',
  async (fence, indexd, users, files) => {
  // do stuff
});

/*
   - Test that a user with `abc-admin` can create signed urls with their own access_token
*/
_Scenario('User with access can create signed urls for records in namespace, not outside namespace @rbac',
  async (fence, indexd, users, files) => {
  // do stuff
});

/*
   - Test client flow to get id_token, compare to what's in userinfo endpoint, ensure
     RBAC policy information is there
        > NOTE: there is an existing test that might satisfy this with a few updates
*/
_Scenario('Test client flow to get id_token, compare to what is in userinfo endpoint, @rbac',
  async (fence, indexd, users, files) => {
  // do stuff
  // TODO: Might not need this, check other tests
});

/*
   - Create some records in indexd with AND logic, have client-abc try to create signed
     url for file for user that does NOT have necessary permissions, ensure failure.
*/
_Scenario('Client with user token WITHOUT permission CANNOT create signed URL for record with rbac AND logic @rbac',
  async (fence, indexd, users, files) => {
  // do stuff
});

/*
   - Same as above test but user DOES have permissions. Ensure successfull signed URL that
     we can access data with
*/
_Scenario('Client with user token WITH permission CAN create signed URL for record with rbac AND logic @rbac',
  async (fence, indexd, users, files) => {
  // do stuff
});

/*
   - Create some records in indexd with OR logic, have client-abc try to create signed
     url for file for user that does NOT have necessary permissions, ensure failure.
*/
_Scenario('Client with user token WITHOUT permission CANNOT create signed URL for record with rbac OR logic @rbac',
  async (fence, indexd, users, files) => {
  // do stuff
});

/*
   - Same as above test but user DOES have permissions. Ensure successfull signed URL that
     we can access data with
*/
_Scenario('Client with user token WITH permission CAN create signed URL for record with rbac OR logic @rbac',
  async (fence, indexd, users, files) => {
  // do stuff
});
