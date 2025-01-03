/*eslint-disable */
Feature('CentralizedAuth @requires-fence @requires-indexd');
/*
Test sponsor use cases for Gen3 Centralized Authorization with new authorization system:

1) As the maintainer of a data node in DCF, we want to grant permissions to submitters to
   create/retrieve/update/delete records in the centralized IndexD under our own namespace,
   so that they could do this on their own without touching other data in the same IndexD.

2) As the maintainer of DCF, we want to grant permissions to data node users to download
   only data for that data node through the centralized Fence, so that the same Fence can
   safely serve data from multiple data nodes with proper permission control.

3) As the owner of a client to Fence, or a user of a client to Fence, I want to retrieve
   user access from the user info endpoint and from the ID token, so my users can see all
   the permissions they have, including authorization information.

4) As the owner of Kids First, I want to be able to specify AND logic in record ACLs,
   e.g. C1 AND C2 AND C3 where Cn is a project, in order to guarantee that the person
   accessing some family-based files from multiple biospecimens has all of the consents.

5) As the owner of a Gen3 Commons, I want the consent requirements on each Node/Record
   checked against the consents signed by the accessing user so that the users won't be
   able to access Node/Record they have no consent to. For now, the consent requirements
   are always defined on Cases.

   For example, Case A requires consent to [X, AA], Case B requires consent to [X, BB].
   In order to access a record or node that belongs to Case A, a user must consent to at
   least both X and AA, or more. If the record or node belongs to both A and B, the user
   must own a superset of consent codes [X, AA, BB]. Of course, the user should have
   access to the record or node in the first place.

---------
Test Plan
---------

1) - Test that user without policies can't CRUD records in /gen3 or /abc

   - Test user with `abc-admin` policy, test creating record, reading record, updating
     record, and deleting in indexD with authz /abc (should work),
     make sure they still can't create, read, update OR delete in /gen3

   - Test the same thing as above, but use a client's access_token for that user

2) - Test ABC_CLIENT creating signed urls for data under /abc, ensure they cannot create
     signed urls for data under /gen3. Ensure that successful signed urls actually
     allow reading data.

   - Test client WITH access creating signed urls for data for user WITHOUT access in namespace.

   - Test client WITHOUT access creating signed urls for data for user WITH access in namespace.

   - Test that a user with `abc-admin` can create signed urls with their own access_token

3) - Test client flow to get id_token, compare to what's in userinfo endpoint, ensure
     authorization policy information is there

4) - Create some records in indexd with AND logic, have ABC_CLIENT try to create signed
     url for file for user that does NOT have necessary permissions, ensure failure.

   - Same as above but user DOES have permissions. Ensure successfull signed URL that
     we can access data with

5) - Create some records in indexd with consent codes, assign a user both permission
     to the data and permission to use that consent code in separate policies

   - Do the same as above but in a single policy

   - Give user access to program/proj but don't give consent code, make sure they cannot access
     the data

   - Give user access to program/proj and HMB policy, make sure they CAN access
     files with GRU
        - Consenting to do HMB research inherently gives you permission
          to General Research Use (GRU) files as well
        - This logic lives in the configured policies for arborist and
          is based primarily on DUO (Data Use Ontology)

Additionally:
  Test signed URL creation for open access files
    - Works when user is anonymous
    - Works when user is logged in
  Test signed URL creation for files that only require AuthN
    - DOES NOT work when user is anonymous
    - Works when user is logged in

------------------------------------
Default Authorization Details
------------------------------------

Access details from default usersync for QA env (where jenkins is run):

Create CLIENT with `abc-admin` and `gen3-admin` policy (CRUD under /abc and /gen3)
Create ABC_CLIENT with `abc-admin` policy (CRUD under /abc)

main@example.org (mainAcct)
    - abc-admin

dummy-one@example.org (auxAcct1)
    - abc.programs.test_program.projects.test_project1-viewer

smarty-two@example.org (auxAcct2)
    - abc.programs.test_program2.projects.test_project3-viewer

user0@example.org (user0)
    - gen3-admin
    - hmb-researcher

*/

const chai = require('chai');
const uuid = require('uuid');
const { Bash } = require('../../utils/bash.js');
const apiUtil = require('../../utils/apiUtil.js');

const bash = new Bash();

const fs = require('fs');

const I = actor();

const indexed_files = {
  abcFooBarFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad0',
    authz: ['/abc/programs/foo/projects/bar'],
    size: 9,
  },
  gen3TestTestFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad1',
    authz: ['/gen3/programs/test_program/projects/test_project'],
    size: 10,
  },
  twoProjectsFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad2',
    authz: [
      '/abc/programs/test_program/projects/test_project1',
      '/abc/programs/test_program2/projects/test_project3',
    ],
    size: 11,
  },
  gen3HmbResearchFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440af1',
    authz: [
      '/gen3/programs/test_program/projects/test_project1',
      '/consents/HMB',
    ],
    size: 43,
  },
  abcHmbResearchFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb90213ef0beed440af1',
    authz: [
      '/abc/programs/test_program/projects/test_project1',
      '/consents/HMB',
    ],
    size: 44,
  },
  gruResearchFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d655ec3f4beb9020eef0beed440af1',
    authz: [
      '/gen3/programs/test_program/projects/test_project1',
      '/consents/GRU',
    ],
    size: 45,
  },
  openAccessFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb90212ef0beed440af1',
    authz: [
      '/open',
    ],
    size: 46,
  },
};

const new_gen3_records = {
  fooBarFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad4',
    authz: ['/gen3/programs/test_program/projects/test_project'],
    size: 9,
  },
  deleteMe: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ac0',
    authz: ['/gen3/programs/test_program/projects/test_project'],
    size: 12,
  },
};

const new_abc_records = {
  fooBarFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad5',
    authz: ['/abc/programs/foo'],
    size: 9,
  },
  deleteMe: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ac1',
    authz: ['/abc/programs/foo/projects/bar'],
    size: 12,
  },
};

BeforeSuite(async ({ fence, users, indexd }) => {
  console.log('Removing test indexd records if they exist');
  await indexd.do.deleteFileIndices(Object.values(new_gen3_records));
  await indexd.do.deleteFileIndices(Object.values(new_abc_records));
  await indexd.do.deleteFileIndices(Object.values(indexed_files));

  console.log('Adding indexd files used to test signed urls');
  const ok = await indexd.do.addFileIndices(Object.values(indexed_files));
  chai.expect(
    ok, 'unable to add files to indexd as part of centralizedAuth setup',
  ).to.be.true;
});

AfterSuite(async ({ fence, indexd, users }) => {
  try {
    console.log('Removing indexd files used to test signed urls');
      await indexd.do.deleteFileIndices(Object.values(indexed_files));
  } catch (error) {
    console.log(error);
}
});

Before(async ({ fence, users, indexd }) => {
  console.log('populating guids for indexd records to create...');
  // populate new GUIDs per test
  const gen3FooBarFileGuid = uuid.v4().toString();
  const gen3DeleteMe = uuid.v4().toString();
  const abcFooBarFileGuid = uuid.v4().toString();
  const abcDeleteMe = uuid.v4().toString();

  new_gen3_records.fooBarFile.did = gen3FooBarFileGuid;
  new_gen3_records.deleteMe.did = gen3DeleteMe;
  new_abc_records.fooBarFile.did = abcFooBarFileGuid;
  new_abc_records.deleteMe.did = abcDeleteMe;
});

/*
   - Test that user without policies can't CRUD records in /gen3 or /abc
*/
Scenario('User without policies cannot CRUD indexd records in /gen3 or /abc @indexdJWT @centralizedAuth',
  async ({ fence, indexd, users, files }) => {
    // create
    const gen3_create_success = await indexd.do.addFileIndices(
      Object.values(new_gen3_records), users.user2.accessTokenHeader,
    );
    const abc_create_success = await indexd.do.addFileIndices(
      Object.values(new_abc_records), users.user2.accessTokenHeader,
    );

    // read to test creation
    const gen3_read_response = await indexd.do.getFileFullRes(
      new_gen3_records.fooBarFile, users.user2.accessTokenHeader,
    );
    const abc_read_response = await indexd.do.getFileFullRes(
      new_abc_records.fooBarFile, users.user2.accessTokenHeader,
    );

    // asserts for read to test creation
    fence.ask.assertStatusCode(
      gen3_read_response, 404,
      msg = 'should have gotten 404 for reading record under `/gen3` (no permission to create)',
    );
    fence.ask.assertStatusCode(
      abc_read_response, 404,
      msg = 'should have gotten 404 for reading record under `/abc` (no permission to create)',
    );

    // force creation of records
    const gen3_force_create_success = await indexd.do.addFileIndices(
      Object.values(new_gen3_records),
    );
    const abc_force_create_success = await indexd.do.addFileIndices(
      Object.values(new_abc_records),
    );
    chai.expect(
      gen3_force_create_success, 'unable to force add files to indexd as part of setup',
    ).to.be.true;
    chai.expect(
      abc_force_create_success, 'unable to force add files to indexd as part of setup',
    ).to.be.true;

    // read again
    const gen3_read_response_after_force_create = await indexd.do.getFileFullRes(
      new_gen3_records.fooBarFile, users.user2.accessTokenHeader,
    );
    const abc_read_response_after_force_create = await indexd.do.getFileFullRes(
      new_abc_records.fooBarFile, users.user2.accessTokenHeader,
    );

    // asserts for read
    fence.ask.assertStatusCode(
      gen3_read_response_after_force_create, 200,
      msg = 'should have gotten authorized 200 for reading record under `/gen3`',
    );
    fence.ask.assertStatusCode(
      abc_read_response_after_force_create, 200,
      msg = 'should have gotten authorized 200 for reading record under `/abc`',
    );

    // update
    const filename_change = {
      file_name: 'test_filename',
    };
    const gen3_update_response = await indexd.do.updateFile(
      new_gen3_records.fooBarFile, filename_change, users.user2.accessTokenHeader,
    );
    const abc_update_response = await indexd.do.updateFile(
      new_abc_records.fooBarFile, filename_change, users.user2.accessTokenHeader,
    );

    // asserts for update
    chai.expect(
      gen3_update_response,
      'should NOT have got successful response when updating record under `/gen3`',
    ).to.not.have.property('did');
    chai.expect(
      abc_update_response,
      'should NOT have got successful response when updating record under `/abc`',
    ).to.not.have.property('did');

    // delete
    const gen3_delete_response = await indexd.do.deleteFile(
      new_gen3_records.deleteMe, users.user2.accessTokenHeader,
    );
    const abc_delete_response = await indexd.do.deleteFile(
      new_abc_records.deleteMe, users.user2.accessTokenHeader,
    );

    // asserts for delete
    indexd.ask.deleteFileNotSuccessful(
      gen3_delete_response,
      new_gen3_records.deleteMe,
      msg = 'should have gotten unauthorized for deleting record under `/gen3`',
    );
    indexd.ask.deleteFileNotSuccessful(
      abc_delete_response,
      new_abc_records.deleteMe,
      msg = 'should have gotten unauthorized for deleting record under `/abc`',
    );
    // Cleanup after each scenario
    console.log('Removing test indexd records if they exist');
    await indexd.do.deleteFileIndices(Object.values(new_gen3_records));
    await indexd.do.deleteFileIndices(Object.values(new_abc_records));
  }).retry(2);

/*
   - Test user with `abc-admin` policy, test creating record, reading record, updating
     record, and deleting in indexD with authz /abc (should work),
     make sure they still can't create, read, update OR delete in /gen3
*/
Scenario('User with access can CRUD indexd records in namespace, not outside namespace @indexdJWT @centralizedAuth',
  async ({ fence, indexd, users, files }) => {
    // create
    const gen3_create_success = await indexd.do.addFileIndices(
      Object.values(new_gen3_records), users.mainAcct.accessTokenHeader,
    );
    const abc_create_success = await indexd.do.addFileIndices(
      Object.values(new_abc_records), users.mainAcct.accessTokenHeader,
    );

    // read to test creation
    const gen3_read_response = await indexd.do.getFileFullRes(
      new_gen3_records.fooBarFile, users.mainAcct.accessTokenHeader,
    );
    const abc_read_response = await indexd.do.getFileFullRes(
      new_abc_records.fooBarFile, users.mainAcct.accessTokenHeader,
    );

    // asserts for read to test creation
    fence.ask.assertStatusCode(
      gen3_read_response, 404,
      msg = 'should have gotten 404 for reading record under `/gen3` (no permission to create)',
    );
    fence.ask.assertStatusCode(
      abc_read_response, 200,
      msg = 'should have gotten 200 for reading record under `/abc` (has permission to create)',
    );

    // force creation of gen3 records
    const gen3_force_create_success = await indexd.do.addFileIndices(
      Object.values(new_gen3_records),
    );
    chai.expect(
      gen3_force_create_success, 'unable to force add files to indexd as part of setup',
    ).to.be.true;

    // read again
    const gen3_read_response_after_force_create = await indexd.do.getFileFullRes(
      new_gen3_records.fooBarFile, users.mainAcct.accessTokenHeader,
    );
    const abc_read_response_after_force_create = await indexd.do.getFileFullRes(
      new_abc_records.fooBarFile, users.mainAcct.accessTokenHeader,
    );

    // asserts for read
    fence.ask.assertStatusCode(
      gen3_read_response_after_force_create, 200,
      msg = 'should have gotten authorized 200 for reading record under `/gen3`',
    );
    fence.ask.assertStatusCode(
      abc_read_response_after_force_create, 200,
      msg = 'should have gotten authorized 200 for reading record under `/abc`',
    );

    // update
    const filename_change = {
      file_name: 'test_filename',
    };
    const gen3_update_response = await indexd.do.updateFile(
      new_gen3_records.fooBarFile, filename_change, users.mainAcct.accessTokenHeader,
    );
    const abc_update_response = await indexd.do.updateFile(
      new_abc_records.fooBarFile, filename_change, users.mainAcct.accessTokenHeader,
    );

    // asserts for update
    chai.expect(
      gen3_update_response,
      'should NOT have got successful response when updating record under `/gen3`',
    ).to.not.have.property('did');
    chai.expect(
      abc_update_response,
      'should have gotten `did` back (successful response) when updating record under `/abc`',
    ).to.have.property('did');
    chai.expect(
      abc_update_response.did,
      'should have SAME `did` back as we requested update for `/abc`',
    ).to.equal(new_abc_records.fooBarFile.did);

    // make sure updated file has updated file name
    const abc_read_response_after_update = await indexd.do.getFileFullRes(
      new_abc_records.fooBarFile, users.mainAcct.accessTokenHeader,
    );
    fence.ask.assertStatusCode(
      abc_read_response_after_update, 200,
      msg = 'should have gotten authorized 200 for reading record under `/abc` after updating',
    );
    chai.expect(
      abc_read_response_after_update.data, 'update record response does not have file_name we updated it with',
    ).to.have.property('file_name', 'test_filename');

    // delete
    const gen3_delete_response = await indexd.do.deleteFile(
      new_gen3_records.deleteMe, users.mainAcct.accessTokenHeader,
    );
    const abc_delete_response = await indexd.do.deleteFile(
      new_abc_records.deleteMe, users.mainAcct.accessTokenHeader,
    );

    // asserts for delete
    indexd.ask.deleteFileNotSuccessful(
      gen3_delete_response,
      new_gen3_records.deleteMe,
      msg = 'should have gotten unauthorized for deleting record under `/gen3`',
    );
    indexd.ask.deleteFileSuccess(
      new_abc_records.deleteMe, abc_delete_response,
      msg = 'user with permission could not delete record under `/abc`.',
    );
    const getRes = await indexd.do.getFileFullRes(new_abc_records.deleteMe);
    indexd.ask.recordDoesNotExist(getRes);
    // Cleanup after each scenario
    console.log('Removing test indexd records if they exist');
    await indexd.do.deleteFileIndices(Object.values(new_gen3_records));
    await indexd.do.deleteFileIndices(Object.values(new_abc_records));
  }).retry(2);

/*
   - Test the same thing as above, but use a client's access_token for that user
*/
Scenario('Client (with access) with user token (with access) can CRUD indexd records in namespace, not outside namespace @indexdJWT @centralizedAuth',
  async ({ fence, indexd, users, files }) => {
    // NOTE: default CLIENT is abc-admin and gen3-admin
    const tokenRes = await fence.complete.getUserTokensWithClient(users.mainAcct);
    const accessToken = tokenRes.data.access_token;

    // create
    const gen3_create_success = await indexd.do.addFileIndices(
      Object.values(new_gen3_records), apiUtil.getAccessTokenHeader(accessToken),
    );
    const abc_create_success = await indexd.do.addFileIndices(
      Object.values(new_abc_records), apiUtil.getAccessTokenHeader(accessToken),
    );

    // read to test creation
    const gen3_read_response = await indexd.do.getFileFullRes(
      new_gen3_records.fooBarFile, apiUtil.getAccessTokenHeader(accessToken),
    );
    const abc_read_response = await indexd.do.getFileFullRes(
      new_abc_records.fooBarFile, apiUtil.getAccessTokenHeader(accessToken),
    );

    // asserts for read to test creation
    fence.ask.assertStatusCode(
      gen3_read_response, 404,
      msg = 'should have gotten 404 for reading record under `/gen3` (no permission to create)',
    );
    fence.ask.assertStatusCode(
      abc_read_response, 200,
      msg = 'should have gotten 200 for reading record under `/abc` (has permission to create)',
    );

    // force creation of gen3 records
    const gen3_force_create_success = await indexd.do.addFileIndices(
      Object.values(new_gen3_records),
    );
    chai.expect(
      gen3_force_create_success, 'unable to force add files to indexd as part of setup',
    ).to.be.true;

    // read again
    const gen3_read_response_after_force_create = await indexd.do.getFileFullRes(
      new_gen3_records.fooBarFile, apiUtil.getAccessTokenHeader(accessToken),
    );
    const abc_read_response_after_force_create = await indexd.do.getFileFullRes(
      new_abc_records.fooBarFile, apiUtil.getAccessTokenHeader(accessToken),
    );

    // asserts for read
    fence.ask.assertStatusCode(
      gen3_read_response_after_force_create, 200,
      msg = 'should have gotten authorized 200 for reading record under `/gen3`',
    );
    fence.ask.assertStatusCode(
      abc_read_response_after_force_create, 200,
      msg = 'should have gotten authorized 200 for reading record under `/abc`',
    );

    // update
    const filename_change = {
      file_name: 'test_filename',
    };
    const gen3_update_response = await indexd.do.updateFile(
      new_gen3_records.fooBarFile, filename_change, apiUtil.getAccessTokenHeader(accessToken),
    );
    const abc_update_response = await indexd.do.updateFile(
      new_abc_records.fooBarFile, filename_change, apiUtil.getAccessTokenHeader(accessToken),
    );

    // asserts for update
    chai.expect(
      gen3_update_response,
      'should NOT have got successful response when updating record under `/gen3`',
    ).to.not.have.property('did');
    chai.expect(
      abc_update_response,
      'should have gotten `did` back (successful response) when updating record under `/abc`',
    ).to.have.property('did');
    chai.expect(
      abc_update_response.did,
      'should have SAME `did` back as we requested update for `/abc`',
    ).to.equal(new_abc_records.fooBarFile.did);

    // make sure updated file has updated file name
    const abc_read_response_after_update = await indexd.do.getFileFullRes(
      new_abc_records.fooBarFile, users.mainAcct.accessTokenHeader,
    );
    if (process.env.DEBUG === 'true') {
      console.log(`abc file after update: ${new_abc_records.fooBarFile}`);
      console.log(`abc file read response after update: ${abc_read_response_after_update}`);
    }
    fence.ask.assertStatusCode(
      abc_read_response_after_update, 200,
      msg = 'should have gotten authorized 200 for reading record under `/abc` after updating',
    );
    chai.expect(
      abc_read_response_after_update.data, 'update record response does not have file_name we updated it with',
    ).to.have.property('file_name', 'test_filename');

    // delete
    const gen3_delete_response = await indexd.do.deleteFile(
      new_gen3_records.deleteMe, apiUtil.getAccessTokenHeader(accessToken),
    );
    const abc_delete_response = await indexd.do.deleteFile(
      new_abc_records.deleteMe, apiUtil.getAccessTokenHeader(accessToken),
    );

    // asserts for delete
    indexd.ask.deleteFileNotSuccessful(
      gen3_delete_response,
      new_gen3_records.deleteMe,
      msg = 'should have gotten unauthorized for deleting record under `/gen3`',
    );
    indexd.ask.deleteFileSuccess(
      new_abc_records.deleteMe, abc_delete_response,
      msg = 'user with permission could not delete record under `/abc`.',
    );
    const getRes = await indexd.do.getFileFullRes(new_abc_records.deleteMe);
    indexd.ask.recordDoesNotExist(getRes);
    // Cleanup after each scenario
    console.log('Removing test indexd records if they exist');
    await indexd.do.deleteFileIndices(Object.values(new_gen3_records));
    await indexd.do.deleteFileIndices(Object.values(new_abc_records));
  }).retry(2);

/*
   - Test ABC_CLIENT creating signed urls for data under /abc, ensure they cannot create
     signed urls for data under /gen3. Ensure that successful signed urls actually
     allow reading data.
*/
Scenario('Client (with access) with user token (with access) can create signed urls for records in namespace, not outside namespace @centralizedAuth',
  async ({ fence, indexd, users, files }) => {
    // NOTE: users.mainAcct and ABC_CLIENT have abc-admin role
    const tokenRes = await fence.complete.getUserTokensWithClient(
      users.mainAcct, fence.props.clients.abcClient,
    );
    const accessToken = tokenRes.data.access_token;

    console.log('Use mainAcct to create signed URL for file under `/abc`');
    // NOTE: passing in accessToken to accessTokenHeader overrides the default one with
    // the one from the client
    const signedUrlAbcRes = await fence.do.createSignedUrlForUser(
      indexed_files.abcFooBarFile.did, apiUtil.getAccessTokenHeader(accessToken),
    );

    console.log('Use mainAcct to create signed URL for file under `/gen3`');
    const signedUrlGen3Res = await fence.do.createSignedUrlForUser(
      indexed_files.gen3TestTestFile.did, apiUtil.getAccessTokenHeader(accessToken),
    );

    const fileAbcContents = await fence.do.getFileFromSignedUrlRes(
      signedUrlAbcRes,
    );
    const fileGen3Contents = await fence.do.getFileFromSignedUrlRes(
      signedUrlGen3Res,
    );

    chai.expect(fileAbcContents,
      'User token with access could NOT create signed urls and read file for records '
      + 'in authorized namespace').to.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
    chai.expect(fileGen3Contents,
      'User token WITHOUT access COULD create signed urls and read file for records '
      + 'in unauthorized namespace').to.not.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
    // Cleanup after each scenario
    console.log('Removing test indexd records if they exist');
    await indexd.do.deleteFileIndices(Object.values(new_gen3_records));
    await indexd.do.deleteFileIndices(Object.values(new_abc_records));
  }).retry(2);

/*
   - Test client WITH access creating signed urls for data for user WITHOUT access in namespace.
*/
Scenario('Client (with access) with user token (WITHOUT access) in namespace @centralizedAuth',
  async ({ fence, indexd, users, files }) => {
    // NOTE: users.mainAcct has access to /abc NOT /gen3
    //       CLIENT does have access to both
    const tokenRes = await fence.complete.getUserTokensWithClient(
      users.mainAcct,
    );
    const accessToken = tokenRes.data.access_token;

    console.log('Use mainAcct to create signed URL for file under `/gen3`');
    const signedUrlGen3Res = await fence.do.createSignedUrlForUser(
      indexed_files.gen3TestTestFile.did, apiUtil.getAccessTokenHeader(accessToken),
    );

    const fileGen3Contents = await fence.do.getFileFromSignedUrlRes(
      signedUrlGen3Res,
    );

    chai.expect(fileGen3Contents,
      'Client using user token WITHOUT access COULD create signed urls and read file '
      + 'for records in namespace').to.not.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
    // Cleanup after each scenario
    console.log('Removing test indexd records if they exist');
    await indexd.do.deleteFileIndices(Object.values(new_gen3_records));
    await indexd.do.deleteFileIndices(Object.values(new_abc_records));
  }).retry(2);

/*
   - Test client WITHOUT access creating signed urls for data for user WITH access in namespace.
*/
Scenario('Client (WITHOUT access) with user token (with access) in namespace @centralizedAuth',
  async ({ fence, indexd, users, files }) => {
    // abcClient only has access to /abc
    // user0 only access to /gen3
    const tokenRes = await fence.complete.getUserTokensWithClient(
      users.user0, fence.props.clients.abcClient,
    );
    const accessToken = tokenRes.data.access_token;

    console.log('Use user0 to create signed URL for file under `/gen3`');
    const signedUrlGen3Res = await fence.do.createSignedUrlForUser(
      indexed_files.gen3TestTestFile.did, apiUtil.getAccessTokenHeader(accessToken),
    );

    const fileGen3Contents = await fence.do.getFileFromSignedUrlRes(
      signedUrlGen3Res,
    );

    chai.expect(fileGen3Contents,
      'Client WITHOUT access using user token WITH access COULD create signed urls '
      + 'and read file for records in namespace').to.not.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
    // Cleanup after each scenario
    console.log('Removing test indexd records if they exist');
    await indexd.do.deleteFileIndices(Object.values(new_gen3_records));
    await indexd.do.deleteFileIndices(Object.values(new_abc_records));
  }).retry(2);

/*
   - Test that a user with `abc-admin` can create signed urls with their own access_token
*/
Scenario('User with access can create signed urls for records in namespace, not outside namespace @centralizedAuth',
  async ({ fence, indexd, users, files }) => {
    // users.mainAcct has abc-admin role
    console.log('Use mainAcct to create signed URL for file under `/abc`');
    const signedUrlAbcRes = await fence.do.createSignedUrlForUser(
      indexed_files.abcFooBarFile.did, users.mainAcct.accessTokenHeader,
    );

    console.log('Use mainAcct to create signed URL for file under `/gen3`');
    const signedUrlGen3Res = await fence.do.createSignedUrlForUser(
      indexed_files.gen3TestTestFile.did, users.mainAcct.accessTokenHeader,
    );

    const fileAbcContents = await fence.do.getFileFromSignedUrlRes(
      signedUrlAbcRes,
    );
    const fileGen3Contents = await fence.do.getFileFromSignedUrlRes(
      signedUrlGen3Res,
    );

    chai.expect(fileAbcContents,
      'User with access could NOT create signed urls and read file for records in '
      + 'authorized namespace').to.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
    chai.expect(fileGen3Contents,
      'User WITHOUT access COULD create signed urls and read file for records in '
      + 'unauthorized namespace').to.not.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
    // Cleanup after each scenario
    console.log('Removing test indexd records if they exist');
    await indexd.do.deleteFileIndices(Object.values(new_gen3_records));
    await indexd.do.deleteFileIndices(Object.values(new_abc_records));
  }).retry(2);

/*
   - Test client flow to get id_token, compare to what's in userinfo endpoint, ensure
     authorization policy information is there
*/
Scenario('Test that userinfo endpoint contains authorization information (resources) @centralizedAuth',
  async ({ fence, indexd, users, files }) => {
    const tokenRes = await fence.complete.getUserTokensWithClient(users.mainAcct);
    const accessToken = tokenRes.data.access_token;

    // list of resources the user endpoint shows access to
    const userInfoRes = await fence.do.getUserInfo(accessToken);
    fence.ask.assertUserInfo(userInfoRes);
    const resourcesOfUser = userInfoRes.data.resources;
    if (process.env.DEBUG === 'true') {
      console.log('list of resources the user endpoint shows access to:');
      console.log(resourcesOfUser);
    }

    // ensure user has authorization information (resources) in the response
    chai.expect(
      resourcesOfUser, 'could not get resources field from id token',
    ).to.not.be.null;
    chai.expect(
      resourcesOfUser, 'could not get resources field from id token',
    ).to.not.be.undefined;
    chai.expect(
      resourcesOfUser.length,
      'Number of resources is not identical in id token and user info',
    ).to.not.equal(0);
    // Cleanup after each scenario
    console.log('Removing test indexd records if they exist');
    await indexd.do.deleteFileIndices(Object.values(new_gen3_records));
    await indexd.do.deleteFileIndices(Object.values(new_abc_records));
  }).retry(2);

/*
   - Create some records in indexd with AND logic, have ABC_CLIENT try to create signed
     url for file for user that does NOT have necessary permissions, ensure failure.
*/
Scenario('Client with user token WITHOUT permission CANNOT create signed URL for record with authz AND logic @centralizedAuth',
  async ({ fence, indexd, users, files }) => {
    // users.auxAcct1 does not have access to both resources
    const tokenRes = await fence.complete.getUserTokensWithClient(
      users.auxAcct1, fence.props.clients.abcClient,
    );
    const accessToken = tokenRes.data.access_token;

    console.log('Use auxAcct1 to create signed URL for file under with indexd authz '
      + 'AND logic');
    const signedUrlRes = await fence.do.createSignedUrlForUser(
      indexed_files.twoProjectsFile.did, apiUtil.getAccessTokenHeader(accessToken),
    );

    const fileContents = await fence.do.getFileFromSignedUrlRes(
      signedUrlRes,
    );

    chai.expect(fileContents,
      'Client using user token WITHOUT access COULD create signed urls and read file '
      + 'for record with authz AND logic in indexd').to.not.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
    // Cleanup after each scenario
    console.log('Removing test indexd records if they exist');
    await indexd.do.deleteFileIndices(Object.values(new_gen3_records));
    await indexd.do.deleteFileIndices(Object.values(new_abc_records));
  }).retry(2);

/*
   - Same as above test but user DOES have permissions. Ensure successful signed URL that
     we can access data with
*/
Scenario('Client with user token WITH permission CAN create signed URL for record with authz AND logic @centralizedAuth',
  async ({ fence, indexd, users, files }) => {
    // users.mainAcct does have access to both resources
    const tokenRes = await fence.complete.getUserTokensWithClient(
      users.mainAcct, fence.props.clients.abcClient,
    );
    const accessToken = tokenRes.data.access_token;

    console.log('Use mainAcct to create signed URL for file under with indexd authz '
      + 'AND logic');
    const signedUrlRes = await fence.do.createSignedUrlForUser(
      indexed_files.twoProjectsFile.did, apiUtil.getAccessTokenHeader(accessToken),
    );

    const fileContents = await fence.do.getFileFromSignedUrlRes(
      signedUrlRes,
    );

    chai.expect(fileContents,
      'Client using user token WITH access CANNOT create signed urls and read file '
      + 'for record with authz AND logic in indexd').to.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
  }).retry(2);

/** ****************************** OPEN ACCESS DATA *********************************** */
Scenario('Test open access data with authenticated user @centralizedAuth',
  async ({ fence, indexd, users, files }) => {
    if (process.env.DEBUG === 'true') {
      console.log('Use user2 to create signed URL for open access file');
      console.log(indexed_files.openAccessFile.did);
    }
    const signedUrlRes = await fence.do.createSignedUrlForUser(
      indexed_files.openAccessFile.did, users.user2.accessTokenHeader,
    );

    const fileContents = await fence.do.getFileFromSignedUrlRes(
      signedUrlRes,
    );

    chai.expect(fileContents,
      'User with access could NOT create signed urls and read file for records in '
      + 'authorized namespace with authorized consent code').to.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
    // Cleanup after each scenario
    console.log('Removing test indexd records if they exist');
    await indexd.do.deleteFileIndices(Object.values(new_gen3_records));
    await indexd.do.deleteFileIndices(Object.values(new_abc_records));
  }).retry(2);

Scenario('Test open access data with anonymous user @centralizedAuth',
  async ({ fence, indexd, users, files }) => {
    const signedUrlRes = await fence.do.createSignedUrlForUser(
      indexed_files.openAccessFile.did, {},
    );

    const fileContents = await fence.do.getFileFromSignedUrlRes(
      signedUrlRes,
    );

    chai.expect(fileContents,
      'User with access could NOT create signed urls and read file for records in '
      + 'authorized namespace with authorized consent code').to.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
    // Cleanup after each scenario
    console.log('Removing test indexd records if they exist');
    await indexd.do.deleteFileIndices(Object.values(new_gen3_records));
    await indexd.do.deleteFileIndices(Object.values(new_abc_records));
  });

/** ******************************** CONSENT CODES ************************************ */

/*
   - Create some records in indexd with consent codes, assign a user both permission
     to the data and permission to use that consent code in separate policies
*/
Scenario('Test create signed URL for file in authorized namespace with authorized consent code (multiple policies) @centralizedAuth',
  async ({ fence, indexd, users, files }) => {
    // user0@example.org (user0)
    //     - gen3-admin
    //     - hmb-researcher
    //
    // gen3HmbResearchFile in `/gen3` namespace but also requires `/consents/HMB`
    console.log('Use user0 to create signed URL for file under `/gen3` with authorized consent code (multiple policies)');
    const signedUrlRes = await fence.do.createSignedUrlForUser(
      indexed_files.gen3HmbResearchFile.did, users.user0.accessTokenHeader,
    );

    const fileContents = await fence.do.getFileFromSignedUrlRes(
      signedUrlRes,
    );

    chai.expect(fileContents,
      'User with access could NOT create signed urls and read file for records in '
      + 'authorized namespace with authorized consent code').to.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
    // Cleanup after each scenario
    console.log('Removing test indexd records if they exist');
    await indexd.do.deleteFileIndices(Object.values(new_gen3_records));
    await indexd.do.deleteFileIndices(Object.values(new_abc_records));
  }).retry(2);

/*
   - Do the same as above but in a single policy
*/
Scenario('Test create signed URL for file in authorized namespace with authorized consent code (single policies) @centralizedAuth',
  async ({ fence, indexd, users, files }) => {
    // user1@example.org (user1)
    //     - gen3-hmb-researcher
    //
    // gen3HmbResearchFile in `/gen3` namespace but also requires `/consents/HMB`
    console.log('Use user1 to create signed URL for file under `/gen3` with authorized consent code (single policy)');
    const signedUrlRes = await fence.do.createSignedUrlForUser(
      indexed_files.gen3HmbResearchFile.did, users.user1.accessTokenHeader,
    );

    const fileContents = await fence.do.getFileFromSignedUrlRes(
      signedUrlRes,
    );

    chai.expect(fileContents,
      'User with access could NOT create signed urls and read file for records in '
      + 'authorized namespace with authorized consent code').to.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
    // Cleanup after each scenario
    console.log('Removing test indexd records if they exist');
    await indexd.do.deleteFileIndices(Object.values(new_gen3_records));
    await indexd.do.deleteFileIndices(Object.values(new_abc_records));
  }).retry(2);


/*
   - Give user access to program/proj but don't give consent code, make sure they cannot access
     the data
*/
Scenario('Test cannot create signed URL for file in authorized namespace with UNauthorized consent code @centralizedAuth',
  async ({ fence, indexd, users, files }) => {
    // main@example.org (mainAcct)
    //     - abc-admin
    //
    // abcHmbResearchFile in `/abc` namespace but also requires `/consents/HMB`
    console.log('Use mainAcct to create signed URL for file under `/abc` with UNauthorized consent code');
    const signedUrlRes = await fence.do.createSignedUrlForUser(
      indexed_files.abcHmbResearchFile.did, users.mainAcct.accessTokenHeader,
    );

    const fileContents = await fence.do.getFileFromSignedUrlRes(
      signedUrlRes,
    );

    chai.expect(fileContents,
      'User WITHOUT access COULD create signed urls and read file for records in '
      + 'authorized namespace with UNauthorized consent code').to.not.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
    // Cleanup after each scenario
    console.log('Removing test indexd records if they exist');
    await indexd.do.deleteFileIndices(Object.values(new_gen3_records));
    await indexd.do.deleteFileIndices(Object.values(new_abc_records));
  }).retry(2);


/*
   - Give user access to program/proj and HMB policy, make sure they CAN access
     files with GRU
*/
Scenario('Test create signed URL for file in authorized namespace with IMPLIED authorized consent code (based on DUO hierarchy) @centralizedAuth',
  async ({ fence, indexd, users, files }) => {
    // user0@example.org (user0)
    //     - gen3-admin
    //     - hmb-researcher
    //
    // gruResearchFile in `/gen3` namespace but also requires `/consents/HMB`
    console.log('Use user0 to create signed URL for file under `/gen3` with authorized consent code (multiple policies)');
    const signedUrlRes = await fence.do.createSignedUrlForUser(
      indexed_files.gruResearchFile.did, users.user0.accessTokenHeader,
    );

    const fileContents = await fence.do.getFileFromSignedUrlRes(
      signedUrlRes,
    );

    chai.expect(fileContents,
      'User with access could NOT create signed urls and read file for records in '
      + 'authorized namespace with authorized consent code').to.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
    // Cleanup after each scenario
    console.log('Removing test indexd records if they exist');
    await indexd.do.deleteFileIndices(Object.values(new_gen3_records));
    await indexd.do.deleteFileIndices(Object.values(new_abc_records));
  }).retry(2);
