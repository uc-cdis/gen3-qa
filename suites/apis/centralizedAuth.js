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

---------
Test Plan
---------

1) - Test that user without policies can't CRUD records in /gen3 or /abc

   - Test user with `abc-admin` policy, test creating record, reading record, updating
     record, and deleting in indexD with rbac /abc (should work),
     make sure they still can't create, read, update OR delete in /gen3

   - Test the same thing as above, but use a client's access_token for that user

2) - Test ABC_CLIENT creating signed urls for data under /abc, ensure they cannot create
     signed urls for data under /gen3. Ensure that successful signed urls actually
     allow reading data.

   - Test client WITH access creating signed urls for data for user WITHOUT access in namespace.

   - Test client WITHOUT access creating signed urls for data for user WITH access in namespace.

   - Test that a user with `abc-admin` can create signed urls with their own access_token

3) - Test client flow to get id_token, compare to what's in userinfo endpoint, ensure
     RBAC policy information is there
        > NOTE: there is an existing test that might satisfy this with a few updates

4) - Create some records in indexd with AND logic, have ABC_CLIENT try to create signed
     url for file for user that does NOT have necessary permissions, ensure failure.

   - Same as above but user DOES have permissions. Ensure successfull signed URL that
     we can access data with

We probably want some tests to make sure that after usersyncing and changing a user's
policies, they can no longer create signed urls?

dbgap syncing tests would be good too (since all these rely on user.yaml)

------------------------------------
Default Authorization Details
------------------------------------

Access details from default usersync:

Create CLIENT with `abc-admin` and `gen3-admin` policy (CRUD under /abc and /gen3)
Create ABC_CLIENT with `abc-admin` policy (CRUD under /abc)

cdis.autotest@gmail.com (mainAcct)
    - abc-admin

dummy-one@planx-pla.net (auxAcct1)
    - abc.programs.test_program.projects.test_project1-viewer

smarty-two@planx-pla.net (auxAcct2)
    - abc.programs.test_program2.projects.test_project3-viewer

dcf-integration-test-0@planx-pla.net (user0)
    - gen3-admin
*/
const { Commons } = require('../../utils/commons.js');
const chai = require('chai');
const { Bash } = require('../../utils/bash.js');
const apiUtil = require('../../utils/apiUtil.js');
const uuid = require('uuid');

const bash = new Bash();

const fs = require('fs');

const I = actor();

const indexed_files = {
  abcFooBarFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad0',
    acl: [],
    rbac: ['/abc/programs/foo/projects/bar'],
    size: 9,
  },
  gen3TestTestFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad1',
    acl: [],
    rbac: ['/gen3/programs/test/projects/test'],
    size: 10,
  },
  twoProjectsFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad2',
    acl: [],
    rbac: [
      '/abc/programs/test_program/projects/test_project1',
      '/abc/programs/test_program2/projects/test_project3'
    ],
    size: 11,
  }
}

let new_gen3_records = {
  fooBarFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad4',
    acl: [],
    rbac: ['/gen3/programs/test/projects/test'],
    size: 9,
  },
  deleteMe: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ac0',
    acl: [],
    rbac: ['/gen3/programs/test/projects/test'],
    size: 12,
  }
}

let new_abc_records = {
  fooBarFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad5',
    acl: [],
    rbac: ['/abc/programs/foo'],
    size: 9,
  },
  deleteMe: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ac1',
    acl: [],
    rbac: ['/abc/programs/foo/projects/bar'],
    size: 12,
  }
}

BeforeSuite(async (fence, users, indexd) => {
  console.log('Removing test indexd records if they exist');
  await indexd.do.deleteFileIndices(Object.values(new_gen3_records));
  await indexd.do.deleteFileIndices(Object.values(new_abc_records));
  await indexd.do.deleteFileIndices(Object.values(indexed_files));
});

AfterSuite(async (fence, indexd, users) => {
  console.log('Removing indexd files used to test signed urls');
  await indexd.do.deleteFileIndices(Object.values(indexed_files));
});

Before(async (fence, users, indexd) => {
  // populate new GUIDs per test
  const gen3FooBarFileGuid = uuid.v4().toString();
  const gen3DeleteMe = uuid.v4().toString();
  const abcFooBarFileGuid = uuid.v4().toString();
  const abcDeleteMe = uuid.v4().toString();

  new_gen3_records.fooBarFile.did = gen3FooBarFileGuid;
  new_gen3_records.deleteMe.did = gen3DeleteMe;
  new_abc_records.fooBarFile.did = abcFooBarFileGuid;
  new_abc_records.deleteMe.did = abcDeleteMe;

  console.log('Adding indexd files used to test signed urls');
  const ok = await indexd.do.addFileIndices(Object.values(indexed_files));
  chai.expect(
    ok, 'unable to add files to indexd as part of centralizedAuth setup').to.be.true;
});

After(async (fence, users, indexd) => {
  // Cleanup after each scenario
  console.log('Removing test indexd records if they exist');
  await indexd.do.deleteFileIndices(Object.values(new_gen3_records));
  await indexd.do.deleteFileIndices(Object.values(new_abc_records));
});

/*
   - Test that user without policies can't CRUD records in /gen3 or /abc
*/
Scenario('User without policies cannot CRUD indexd records in /gen3 or /abc @indexdJWT',
  async (fence, indexd, users, files) => {
    return; // FIXME: skip test for now
    // create
    const gen3_create_success = await indexd.do.addFileIndices(
        Object.values(new_gen3_records), users.user2.accessTokenHeader);
    const abc_create_success = await indexd.do.addFileIndices(
        Object.values(new_abc_records), users.user2.accessTokenHeader);

    // asserts for create
    chai.expect(
      gen3_create_success,
      'uh oh, user without permission was able to register files to indexd under `/gen3`'
    ).to.be.false;
    chai.expect(
      abc_create_success,
      'uh oh, user without permission was able to register files to indexd under `/abc`'
    ).to.be.false;

    // read
    const gen3_read_response = indexd.do.getFile(
        new_gen3_records.fooBarFile, users.user2.accessTokenHeader)
    const abc_read_response = indexd.do.getFile(
        new_abc_records.fooBarFile, users.user2.accessTokenHeader)

    // asserts for read
    fenceQuestions.assertStatusCode(
        gen3_read_response, 403,
        msg='should have gotten unauthorized for reading record under `/gen3`'
    );
    fenceQuestions.assertStatusCode(
        abc_read_response, 403,
        msg='should have gotten unauthorized for reading record under `/abc`'
    );

    // update
    const filename_change = {
      'file_name': 'test_filename'
    }
    const gen3_update_response = indexd.do.updateFile(
        new_gen3_records.fooBarFile, filename_change, users.user2.accessTokenHeader)
    const abc_update_response = indexd.do.updateFile(
        new_abc_records.fooBarFile, filename_change, users.user2.accessTokenHeader)

    // asserts for update
    fenceQuestions.assertStatusCode(
        gen3_update_response, 403,
        msg='should have gotten unauthorized for updating record under `/gen3`'
    );
    fenceQuestions.assertStatusCode(
        abc_update_response, 403,
        msg='should have gotten unauthorized for updating record under `/abc`'
    );

    // delete
    const gen3_delete_response = indexd.do.deleteFile(
        new_gen3_records.deleteMe, users.user2.accessTokenHeader)
    const abc_delete_response = indexd.do.deleteFile(
        new_abc_records.deleteMe, users.user2.accessTokenHeader)

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
Scenario('User with access can CRUD indexd records in namespace, not outside namespace @indexdJWT',
  async (fence, indexd, users, files) => {
    return; // FIXME: skip test for now
    // create
    const gen3_create_success = await indexd.do.addFileIndices(
        Object.values(new_gen3_records), users.mainAcct.accessTokenHeader);
    const abc_create_success = await indexd.do.addFileIndices(
        Object.values(new_abc_records), users.mainAcct.accessTokenHeader);

    // asserts for create
    chai.expect(
      gen3_create_success,
      'uh oh, user without permission was able to register files to indexd under `/gen3`'
    ).to.be.false;
    chai.expect(
      abc_create_success,
      'user with permission was NOT able to register files to indexd under `/abc`'
    ).to.be.true;

    // read
    const gen3_read_response = indexd.do.getFile(
        new_gen3_records.fooBarFile, users.mainAcct.accessTokenHeader)
    const abc_read_response = indexd.do.getFile(
        new_abc_records.fooBarFile, users.mainAcct.accessTokenHeader)

    // asserts for read
    fenceQuestions.assertStatusCode(
        gen3_read_response, 403,
        msg='should have gotten unauthorized for reading record under `/gen3`'
    );
    fenceQuestions.assertStatusCode(
        abc_read_response, 200,
        msg='user with permission could not read record under `/abc`'
    );

    // update
    const filename_change = {
      'file_name': 'test_filename'
    }
    const gen3_update_response = indexd.do.updateFile(
        new_gen3_records.fooBarFile, filename_change, users.mainAcct.accessTokenHeader)
    const abc_update_response = indexd.do.updateFile(
        new_abc_records.fooBarFile, filename_change, users.mainAcct.accessTokenHeader)

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

    // delete
    const gen3_delete_response = indexd.do.deleteFile(
        new_gen3_records.deleteMe, users.mainAcct.accessTokenHeader)
    const abc_delete_response = indexd.do.deleteFile(
        new_abc_records.deleteMe, users.mainAcct.accessTokenHeader)

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
Scenario('Client (with access) with user token (with access) can CRUD indexd records in namespace, not outside namespace @indexdJWT',
  async (fence, indexd, users, files) => {
    return; // FIXME: skip test for now
    // NOTE: default CLIENT is abc-admin and gen3-admin
    const tokenRes = await fence.complete.getUserTokensWithClient(users.mainAcct);
    const accessToken = tokenRes.body.access_token;

    // create
    const gen3_create_success = await indexd.do.addFileIndices(
        Object.values(new_gen3_records), apiUtil.getAccessTokenHeader(accessToken));
    const abc_create_success = await indexd.do.addFileIndices(
        Object.values(new_abc_records), apiUtil.getAccessTokenHeader(accessToken));

    // asserts for create
    chai.expect(
      gen3_create_success,
      'uh oh, user without permission was able to register files to indexd under `/gen3`'
    ).to.be.false;
    chai.expect(
      abc_create_success,
      'user with permission was NOT able to register files to indexd under `/abc`'
    ).to.be.true;

    // read
    const gen3_read_response = indexd.do.getFile(
        new_gen3_records.fooBarFile, apiUtil.getAccessTokenHeader(accessToken))
    const abc_read_response = indexd.do.getFile(
        new_abc_records.fooBarFile, apiUtil.getAccessTokenHeader(accessToken))

    // asserts for read
    fenceQuestions.assertStatusCode(
        gen3_read_response, 403,
        msg='should have gotten unauthorized for reading record under `/gen3`'
    );
    fenceQuestions.assertStatusCode(
        abc_read_response, 200,
        msg='user with permission could not read record under `/abc`'
    );

    // update
    const filename_change = {
      'file_name': 'test_filename'
    }
    const gen3_update_response = indexd.do.updateFile(
        new_gen3_records.fooBarFile, filename_change, apiUtil.getAccessTokenHeader(accessToken))
    const abc_update_response = indexd.do.updateFile(
        new_abc_records.fooBarFile, filename_change, apiUtil.getAccessTokenHeader(accessToken))

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

    // delete
    const gen3_delete_response = indexd.do.deleteFile(
        new_gen3_records.deleteMe, apiUtil.getAccessTokenHeader(accessToken))
    const abc_delete_response = indexd.do.deleteFile(
        new_abc_records.deleteMe, apiUtil.getAccessTokenHeader(accessToken))

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
   - Test ABC_CLIENT creating signed urls for data under /abc, ensure they cannot create
     signed urls for data under /gen3. Ensure that successful signed urls actually
     allow reading data.
*/
Scenario('Client (with access) with user token (with access) can create signed urls for records in namespace, not outside namespace @centralizedAuth',
  async (fence, indexd, users, files) => {
    return; // FIXME: skip test for now
    // NOTE: users.mainAcct and ABC_CLIENT have abc-admin role
    const tokenRes = await fence.complete.getUserTokensWithClient(
      users.mainAcct, fence.props.clients.abcClient);
    const accessToken = tokenRes.body.access_token;

    console.log('Use mainAcct to create signed URL for file under `/abc`')
    // NOTE: passing in accessToken to accessTokenHeader overrides the default one with
    // the one from the client
    const signedUrlAbcRes = await fence.do.createSignedUrlForUser(
      indexed_files.abcFooBarFile.did, apiUtil.getAccessTokenHeader(accessToken));

    console.log('Use mainAcct to create signed URL for file under `/gen3`')
    const signedUrlGen3Res = await fence.do.createSignedUrlForUser(
      indexed_files.gen3TestTestFile.did, apiUtil.getAccessTokenHeader(accessToken));

    let fileAbcContents = await fence.do.getFileFromSignedUrlRes(
      signedUrlAbcRes);
    let fileGen3Contents = await fence.do.getFileFromSignedUrlRes(
      signedUrlGen3Res);

    chai.expect(fileAbcContents,
      'User token with access could NOT create signed urls and read file for records ' +
      'in authorized namespace'
    ).to.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
    chai.expect(fileGen3Contents,
      'User token WITHOUT access COULD create signed urls and read file for records ' +
      'in unauthorized namespace'
    ).to.not.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
});

/*
   - Test client WITH access creating signed urls for data for user WITHOUT access in namespace.
*/
Scenario('Client (with access) with user token (WITHOUT access) in namespace @centralizedAuth',
  async (fence, indexd, users, files) => {
    return; // FIXME: skip test for now
    // NOTE: users.mainAcct has access to /abc NOT /gen3
    //       CLIENT does have access to both
    const tokenRes = await fence.complete.getUserTokensWithClient(
      users.mainAcct);
    const accessToken = tokenRes.body.access_token;

    console.log('Use mainAcct to create signed URL for file under `/gen3`')
    const signedUrlGen3Res = await fence.do.createSignedUrlForUser(
      indexed_files.gen3TestTestFile.did, apiUtil.getAccessTokenHeader(accessToken));

    let fileGen3Contents = await fence.do.getFileFromSignedUrlRes(
      signedUrlGen3Res);

    chai.expect(fileGen3Contents,
      'Client using user token WITHOUT access COULD create signed urls and read file ' +
      'for records in namespace'
    ).to.not.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
});

/*
   - Test client WITHOUT access creating signed urls for data for user WITH access in namespace.
*/
Scenario('Client (WITHOUT access) with user token (with access) in namespace @centralizedAuth',
  async (fence, indexd, users, files) => {
    return; // FIXME: skip test for now
    // abcClient only has access to /abc
    // user0 only access to /gen3
    const tokenRes = await fence.complete.getUserTokensWithClient(
      users.user0, fence.props.clients.abcClient);
    const accessToken = tokenRes.body.access_token;

    console.log('Use user0 to create signed URL for file under `/gen3`')
    const signedUrlGen3Res = await fence.do.createSignedUrlForUser(
      indexed_files.gen3TestTestFile.did, apiUtil.getAccessTokenHeader(accessToken));

    let fileGen3Contents = await fence.do.getFileFromSignedUrlRes(
      signedUrlGen3Res);

    chai.expect(fileGen3Contents,
      'Client WITHOUT access using user token WITH access COULD create signed urls ' +
      'and read file for records in namespace'
    ).to.not.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
});

/*
   - Test that a user with `abc-admin` can create signed urls with their own access_token
*/
Scenario('User with access can create signed urls for records in namespace, not outside namespace @centralizedAuth',
  async (fence, indexd, users, files) => {
    return; // FIXME: skip test for now
    // users.mainAcct has abc-admin role
    console.log('Use mainAcct to create signed URL for file under `/abc`')
    const signedUrlAbcRes = await fence.do.createSignedUrlForUser(
      indexed_files.abcFooBarFile.did, users.mainAcct.accessTokenHeader);

    console.log('Use mainAcct to create signed URL for file under `/gen3`')
    const signedUrlGen3Res = await fence.do.createSignedUrlForUser(
      indexed_files.gen3TestTestFile.did, users.mainAcct.accessTokenHeader);

    let fileAbcContents = await fence.do.getFileFromSignedUrlRes(
      signedUrlAbcRes);
    let fileGen3Contents = await fence.do.getFileFromSignedUrlRes(
      signedUrlGen3Res);

    chai.expect(fileAbcContents,
      'User with access could NOT create signed urls and read file for records in ' +
      'authorized namespace'
    ).to.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
    chai.expect(fileGen3Contents,
      'User WITHOUT access COULD create signed urls and read file for records in ' +
      'unauthorized namespace'
    ).to.not.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
});

/*
   - Test client flow to get id_token, compare to what's in userinfo endpoint, ensure
     RBAC policy information is there
*/
Scenario('Test client flow to get id_token, compare to what is in userinfo endpoint, @centralizedAuth',
  async (fence, indexd, users, files) => {
    return; // FIXME: skip test for now
    const tokenRes = await fence.complete.getUserTokensWithClient(users.mainAcct);
    const accessToken = tokenRes.body.access_token;
    const idToken = tokenRes.body.id_token;

    // list of policies the id token gives access to
    tokenClaims = apiUtil.parseJwt(idToken);
    policiesInToken = tokenClaims.context.user.policies;
    console.log('list of policies the id token gives access to:')
    console.log(policiesInToken);

    // list of policies the user endpoint shows access to
    userInfoRes = await fence.do.getUserInfo(accessToken);
    fence.ask.assertUserInfo(userInfoRes);
    policiesOfUser = userInfoRes.body.policies;
    console.log('list of policies the user endpoint shows access to:')
    console.log(policiesOfUser);

    // test object equality
    chai.expect(
      policiesInToken.length,
      `Number of policies is not identical in id token and user info`
    ).to.equal(policiesOfUser.length)

    for (var i = 0; i < policiesInToken.length; i++) {
      // test list equality
      chai.expect(
        JSON.stringify(policiesInToken[p].sort()),
        `Policies are not identical in id token and user info`
      ).to.equal(JSON.stringify(policiesOfUser[p].sort()));
  }
});

/*
   - Create some records in indexd with AND logic, have ABC_CLIENT try to create signed
     url for file for user that does NOT have necessary permissions, ensure failure.
*/
Scenario('Client with user token WITHOUT permission CANNOT create signed URL for record with rbac AND logic @centralizedAuth',
  async (fence, indexd, users, files) => {
    return; // FIXME: skip test for now
    // users.auxAcct1 does not have access to both resources
    const tokenRes = await fence.complete.getUserTokensWithClient(
      users.auxAcct1, fence.props.clients.abcClient);
    const accessToken = tokenRes.body.access_token;

    console.log('Use auxAcct1 to create signed URL for file under with indexd rbac ' +
      'AND logic')
    const signedUrlRes = await fence.do.createSignedUrlForUser(
      indexed_files.twoProjectsFile.did, apiUtil.getAccessTokenHeader(accessToken));

    let fileContents = await fence.do.getFileFromSignedUrlRes(
      signedUrlRes);

    chai.expect(fileContents,
      'Client using user token WITHOUT access COULD create signed urls and read file ' +
      'for record with rbac AND logic in indexd'
    ).to.not.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
});

/*
   - Same as above test but user DOES have permissions. Ensure successful signed URL that
     we can access data with
*/
Scenario('Client with user token WITH permission CAN create signed URL for record with rbac AND logic @centralizedAuth',
  async (fence, indexd, users, files) => {
    return; // FIXME: skip test for now
    // users.mainAcct does have access to both resources
    const tokenRes = await fence.complete.getUserTokensWithClient(
      users.mainAcct, fence.props.clients.abcClient);
    const accessToken = tokenRes.body.access_token;

    console.log('Use mainAcct to create signed URL for file under with indexd rbac ' +
      'AND logic')
    const signedUrlRes = await fence.do.createSignedUrlForUser(
      indexed_files.twoProjectsFile.did, apiUtil.getAccessTokenHeader(accessToken));

    let fileContents = await fence.do.getFileFromSignedUrlRes(
      signedUrlRes);

    chai.expect(fileContents,
      'Client using user token WITH access CANNOT create signed urls and read file ' +
      'for record with rbac AND logic in indexd'
    ).to.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
});
