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
for twoProjectsFile, use cdis.autotest@gmail.com

for oneProjectOrOtherFile, two users. Each has ONE of these policies:
    dummy-one@planx-pla.net
        - abc.programs.test_program.projects.test_project1-viewer
    smarty-two@planx-pla.net
        - abc.programs.test_program2.projects.test_project3-viewer
*/
const indexed_files = {
  abcFooBarFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad0',
    acl: ['*'], // FIXME: remove this and uncomment rbac
    // rbac: '/abc/programs/foo/projects/bar',
    size: 9,
  },
  gen3TestTestFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad1',
    acl: ['*'], // FIXME: remove this and uncomment rbac
    // rbac: '/gen3/programs/test/projects/test',
    size: 10,
  },
  twoProjectsFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad2',
    acl: ['*'], // FIXME: remove this and uncomment rbac
    // rbac: '/abc/programs/test_program/projects/test_project1 AND /abc/programs/test_program2/projects/test_project3',
    size: 11,
  },
  oneProjectOrOtherFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad3',
    acl: ['*'], // FIXME: remove this and uncomment rbac
    // rbac: '/abc/programs/test_program/projects/test_project1 OR /abc/programs/test_program2/projects/test_project3',
    size: 12,
  }
}

let new_gen3_records = {
  fooBarFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad4',
    acl: ['*'], // FIXME: remove this and uncomment rbac
    // rbac: '/gen3/programs/test/projects/test',
    size: 9,
  },
  deleteMe: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ac0',
    acl: ['*'], // FIXME: remove this and uncomment rbac
    // rbac: '/gen3/programs/test/projects/test',
    size: 12,
  }
}

let new_abc_records = {
  fooBarFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad5',
    acl: ['*'], // FIXME: remove this and uncomment rbac
    // rbac: '/abc/programs/foo',
    size: 9,
  },
  deleteMe: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ac1',
    acl: ['*'], // FIXME: remove this and uncomment rbac
    // rbac: '/abc/programs/foo/projects/bar',
    size: 12,
  }
}

BeforeSuite(async (fence, users, indexd) => {
  console.log('Adding indexd files used to test signed urls');
  const ok = await indexd.do.addFileIndices(Object.values(indexed_files));
  chai.expect(
    ok, 'unable to add files to indexd as part of centralizedAuth setup').to.be.true;
});

AfterSuite(async (fence, indexd, users) => {
  console.log('Removing indexd files used to test signed urls');
  await indexd.do.deleteFileIndices(Object.values(indexed_files));
});

Before(async (fence, users) => {
  // populate new GUIDs per test
  const gen3FooBarFileGuid = uuid.v4().toString();
  const gen3DeleteMe = uuid.v4().toString();
  const abcFooBarFileGuid = uuid.v4().toString();
  const abcDeleteMe = uuid.v4().toString();

  new_gen3_records.fooBarFile.did = gen3FooBarFileGuid;
  new_gen3_records.deleteMe.did = gen3DeleteMe;
  new_gen3_records.fooBarFile.did = abcFooBarFileGuid;
  new_gen3_records.deleteMe.did = abcDeleteMe;
});

After(async (fence, users) => {
  // Cleanup after each scenario
  console.log('Removing test indexd records if they exist');
  await indexd.do.deleteFileIndices(Object.values(new_gen3_records));
  await indexd.do.deleteFileIndices(Object.values(new_abc_records));
});

/*
   - Test that user without policies can't CRUD records in /gen3 or /abc
*/
Scenario('User without policies cannot CRUD indexd records in /gen3 or /abc @rbac',
  async (fence, indexd, users, files) => {
    // create
    const gen3_create_success = await indexd.do.addFileIndices(
        Object.values(new_gen3_records), users.user2.accessTokenHeader);
    const abc_create_success = await indexd.do.addFileIndices(
        Object.values(new_abc_records), users.user2.accessTokenHeader);

    // read
    const gen3_read_response = indexd.do.getFile(
        new_gen3_records.fooBarFile, users.user2.accessTokenHeader)
    const abc_read_response = indexd.do.getFile(
        new_abc_records.fooBarFile, users.user2.accessTokenHeader)

    // update
    const filename_change = {
      "file_name": "test_filename"
    }
    const gen3_update_response = indexd.do.updateFile(
        new_gen3_records.fooBarFile, filename_change, users.user2.accessTokenHeader)
    const abc_update_response = indexd.do.updateFile(
        new_abc_records.fooBarFile, filename_change, users.user2.accessTokenHeader)

    // delete
    const gen3_update_response = indexd.do.deleteFile(
        new_gen3_records.deleteMe, users.user2.accessTokenHeader)
    const abc_update_response = indexd.do.deleteFile(
        new_abc_records.deleteMe, users.user2.accessTokenHeader)

    // asserts for create
    chai.expect(
      gen3_create_success,
      'uh oh, user without permission was able to register files to indexd under `/gen3`'
    ).to.be.false;
    chai.expect(
      abc_create_success,
      'uh oh, user without permission was able to register files to indexd under `/abc`'
    ).to.be.false;

    // asserts for read
    fenceQuestions.assertStatusCode(
        gen3_read_response, 403,
        msg='should have gotten unauthorized for reading record under `/gen3`'
    );
    fenceQuestions.assertStatusCode(
        abc_read_response, 403,
        msg='should have gotten unauthorized for reading record under `/abc`'
    );

    // asserts for update
    fenceQuestions.assertStatusCode(
        gen3_update_response, 403,
        msg='should have gotten unauthorized for updating record under `/gen3`'
    );
    fenceQuestions.assertStatusCode(
        abc_update_response, 403,
        msg='should have gotten unauthorized for updating record under `/abc`'
    );

    // asserts for delete
    fenceQuestions.assertStatusCode(
        gen3_delete_response, 403,
        msg='should have gotten unauthorized for deleting record under `/gen3`'
    );
    fenceQuestions.assertStatusCode(
        abc_delete_response, 403,
        msg='should have gotten unauthorized for deleting record under `/abc`'
    );
});

/*
   - Test user with `abc-admin` policy, test creating record, reading record, updating
     record, and deleting in indexD with rbac /abc (should work),
     make sure they still can't create, read, update OR delete in /gen3
*/
Scenario('User with access can CRUD indexd records in namespace, not outside namespace @rbac',
  async (fence, indexd, users, files) => {
    return; // FIXME: skip test for now
    // create
    const gen3_create_success = await indexd.do.addFileIndices(
        Object.values(new_gen3_records), users.mainAcct.accessTokenHeader);
    const abc_create_success = await indexd.do.addFileIndices(
        Object.values(new_abc_records), users.mainAcct.accessTokenHeader);

    // read
    const gen3_read_response = indexd.do.getFile(
        new_gen3_records.fooBarFile, users.mainAcct.accessTokenHeader)
    const abc_read_response = indexd.do.getFile(
        new_abc_records.fooBarFile, users.mainAcct.accessTokenHeader)

    // update
    const filename_change = {
      "file_name": "test_filename"
    }
    const gen3_update_response = indexd.do.updateFile(
        new_gen3_records.fooBarFile, filename_change, users.mainAcct.accessTokenHeader)
    const abc_update_response = indexd.do.updateFile(
        new_abc_records.fooBarFile, filename_change, users.mainAcct.accessTokenHeader)

    // delete
    const gen3_update_response = indexd.do.deleteFile(
        new_gen3_records.deleteMe, users.mainAcct.accessTokenHeader)
    const abc_update_response = indexd.do.deleteFile(
        new_abc_records.deleteMe, users.mainAcct.accessTokenHeader)

    // asserts for create
    chai.expect(
      gen3_create_success,
      'uh oh, user without permission was able to register files to indexd under `/gen3`'
    ).to.be.false;
    chai.expect(
      abc_create_success,
      'user with permission was NOT able to register files to indexd under `/abc`'
    ).to.be.true;

    // asserts for read
    fenceQuestions.assertStatusCode(
        gen3_read_response, 403,
        msg='should have gotten unauthorized for reading record under `/gen3`'
    );
    fenceQuestions.assertStatusCode(
        abc_read_response, 200,
        msg='user with permission could not read record under `/abc`'
    );

    // asserts for update
    fenceQuestions.assertStatusCode(
        gen3_update_response, 403,
        msg='should have gotten unauthorized for updating record under `/gen3`'
    );
    fenceQuestions.assertStatusCode(
        abc_update_response, 200,
        msg='user with permission could not update record under `/abc`'
    );
    chai.expect(
        abc_read_response, 'update response does not contain file_name'
    ).to.have.property('file_name');
    chai.expect(
        abc_read_response.file_name,
        'update record response does not have filename we updated it with'
    ).to.have.string('test_filename');

    // asserts for delete
    fenceQuestions.assertStatusCode(
        gen3_delete_response, 403,
        msg='should have gotten unauthorized for deleting record under `/gen3`'
    );
    fenceQuestions.assertStatusCode(
        abc_delete_response, 200,
        msg='user with permission could not delete record under `/abc`'
    );
});

/*
   - Test the same thing as above, but use a client's access_token for that user
*/
Scenario('Client with user token with access can CRUD indexd records in namespace, not outside namespace @rbac',
  async (fence, indexd, users, files) => {
    // users.mainAcct
    const tokenRes = fence.complete.getUserTokensWithClient(users.mainAcct);
    const accessToken = tokenRes.body.access_token;
});

/*
   - Test client-abc creating signed urls for data under /abc, ensure they cannot create
     signed urls for data under /gen3. Ensure that successful signed urls actually
     allow reading data.
*/
Scenario('Client with user token with access can create signed urls for records in namespace, not outside namespace @rbac',
  async (fence, indexd, users, files) => {
    return; // FIXME: skip test for now
    // do stuff
    // users.mainAcct
    // console.log('Use User0 to create signed URL for file in QA')
    // const User0signedUrlQA1Res = await fence.do.createSignedUrlForUser(
    //   indexed_files.qaFile.did, users.user0.accessTokenHeader);
    // let User0signedUrlQA1FileContents = await fence.do.getGoogleFileFromSignedUrlRes(
    //   User0signedUrlQA1Res);
});

/*
   - Test that a user with `abc-admin` can create signed urls with their own access_token
*/
Scenario('User with access can create signed urls for records in namespace, not outside namespace @rbac',
  async (fence, indexd, users, files) => {
    return; // FIXME: skip test for now
    // do stuff
    // users.mainAcct
});

/*
   - Test client flow to get id_token, compare to what's in userinfo endpoint, ensure
     RBAC policy information is there
        > NOTE: there is an existing test that might satisfy this with a few updates
*/
Scenario('Test client flow to get id_token, compare to what is in userinfo endpoint, @rbac',
  async (fence, indexd, users, files) => {
    return; // FIXME: skip test for now
    // do stuff
    // TODO: Might not need this, check other tests
});

/*
   - Create some records in indexd with AND logic, have client-abc try to create signed
     url for file for user that does NOT have necessary permissions, ensure failure.
*/
Scenario('Client with user token WITHOUT permission CANNOT create signed URL for record with rbac AND logic @rbac',
  async (fence, indexd, users, files) => {
    return; // FIXME: skip test for now
    // do stuff
    // users.auxAcct1
});

/*
   - Same as above test but user DOES have permissions. Ensure successfull signed URL that
     we can access data with
*/
Scenario('Client with user token WITH permission CAN create signed URL for record with rbac AND logic @rbac',
  async (fence, indexd, users, files) => {
    return; // FIXME: skip test for now
    // do stuff
    // users.mainAcct
});

/*
   - Create some records in indexd with OR logic, have client-abc try to create signed
     url for file for user that does NOT have necessary permissions, ensure failure.
*/
Scenario('Client with user token WITHOUT permission CANNOT create signed URL for record with rbac OR logic @rbac',
  async (fence, indexd, users, files) => {
    return; // FIXME: skip test for now
    // do stuff
    // users.user0
});

/*
   - Same as above test but user DOES have permissions. Ensure successfull signed URL that
     we can access data with
*/
Scenario('Client with user token WITH permission CAN create signed URL for record with rbac OR logic @rbac',
  async (fence, indexd, users, files) => {
    return; // FIXME: skip test for now
    // do stuff
    // users.auxAcct1 && users.auxAcct2
});
