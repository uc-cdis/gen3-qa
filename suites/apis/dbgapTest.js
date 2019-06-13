Feature('dbgapSyncing');
/*
Test running usersync job and pulling files from a fake dbgap sftp server (populated
with fake telemetry / user access files). Ensure users can download files they should
have access to through dbgap.

User Access from user.yaml:

    cdis.autotest@gmail.com (mainAcct)
        - programs.QA-admin
        - programs.test-admin
        - programs.DEV-admin
        - programs.jnkns-admin
        - abc-admin

User Access from dbGaP (just read access):

    cdis.autotest@gmail.com (mainAcct)
        - phs000178
*/

const { Commons } = require('../../utils/commons.js');
const chai = require('chai');
const { Bash } = require('../../utils/bash.js');
const apiUtil = require('../../utils/apiUtil.js');
const fenceProps = require('../../services/apis/fence/fenceProps.js');
const uuid = require('uuid');

const bash = new Bash();

const fs = require('fs');

const I = actor();

// NOTE: phs000179 file is from QA google bucket
//       phs000178 file is from test google bucket
const indexed_files = {
  phs000178File: {
    filename: 'testdata',
    urls: [
      's3://cdis-presigned-url-test/testdata',
      'gs://' + fenceProps.googleBucketInfo.test.bucketId + '/' + fenceProps.googleBucketInfo.test.fileName
    ],
    md5: '73d643ec3f4beb9020eef0beed440ad0',
    authz: ['/dbgap/programs/phs000178'],
    size: 9,
  },
  phs000179File: {
    filename: 'testdata',
    urls: [
      's3://cdis-presigned-url-test/testdata',
      'gs://' + fenceProps.googleBucketInfo.QA.bucketId + '/' + fenceProps.googleBucketInfo.QA.fileName
    ],
    md5: '73d643ec3f4beb9020eef0beed440ad1',
    authz: ['/dbgap/programs/phs000179'],
    size: 10,
  },
  QAFile: {
    filename: 'testdata',
    urls: [
      's3://cdis-presigned-url-test/testdata',
      'gs://' + fenceProps.googleBucketInfo.QA.bucketId + '/' + fenceProps.googleBucketInfo.QA.fileName
    ],
    md5: '73d643ec3f4beb9020eef0beed440ac5',
    authz: ['/gen3/programs/QA/projects/foobar'],
    size: 11,
  }
}

let new_dbgap_records = {
  fooBarFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad4',
    authz: ['/dbgap/programs/phs000178'],
    size: 12,
  }
}

BeforeSuite(async (fence, users, indexd) => {
  console.log('Removing test indexd records if they exist');
  await indexd.do.deleteFileIndices(Object.values(indexed_files));
  await indexd.do.deleteFileIndices(Object.values(new_dbgap_records));

  console.log('Adding indexd files used to test signed urls');
  const ok = await indexd.do.addFileIndices(Object.values(indexed_files));
  chai.expect(
    ok, 'unable to add files to indexd as part of dbgapTest setup').to.be.true;
});

AfterSuite(async (fence, indexd, users) => {
  console.log('Removing indexd files used to test signed urls');
  await indexd.do.deleteFileIndices(Object.values(indexed_files));
  await indexd.do.deleteFileIndices(Object.values(new_dbgap_records));

  console.log('Running usersync after dbgap testing');
  bash.runJob('usersync', args='FORCE true');
});

Scenario('dbGaP Sync: created signed urls (from s3 and gs) to download, try creating urls to upload @dbgapSyncing @reqGoogle',
  async (fence, indexd, users, files) => {
    console.log(`Running usersync job and forcing only dbgap sync`);
    bash.runJob('usersync', args='FORCE true ONLY_DBGAP true');

    // users.mainAcct has access to phs000178
    console.log('Use mainAcct to create s3 signed URL for file phs000178')
    const signedUrls3phs000178Res = await fence.do.createSignedUrl(
      indexed_files.phs000178File.did, ['protocol=s3'],
      users.mainAcct.accessTokenHeader
    );
    console.log('Use mainAcct to create gs signed URL for file phs000178')
    const signedUrlgsPhs000178Res = await fence.do.createSignedUrl(
      indexed_files.phs000178File.did, ['protocol=gs'],
      users.mainAcct.accessTokenHeader
    );

    let phs000178s3FileContents = await fence.do.getFileFromSignedUrlRes(
      signedUrls3phs000178Res);
    let phs000178gsFileContents = await fence.do.getFileFromSignedUrlRes(
      signedUrlgsPhs000178Res);

    chai.expect(phs000178s3FileContents,
      `User ${users.mainAcct.username} with access could NOT create s3 signed urls ` +
      'and read file for a record in authorized dbGaP project phs000178'
    ).to.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
    chai.expect(phs000178gsFileContents,
      `User ${users.mainAcct.username} with access could NOT create gs signed urls ` +
      'and read file for a record in authorized dbGaP project phs000178'
    ).to.equal(fence.props.googleBucketInfo.test.fileContents);

    // users.mainAcct does NOT have access to phs000179
    console.log('Use mainAcct to create s3 signed URL for file phs000179')
    const signedUrls3phs000179Res = await fence.do.createSignedUrl(
      indexed_files.phs000179File.did, ['protocol=s3'],
      users.mainAcct.accessTokenHeader
    );
    console.log('Use mainAcct to create gs signed URL for file phs000179')
    const signedUrlgsPhs000179Res = await fence.do.createSignedUrl(
      indexed_files.phs000179File.did, ['protocol=gs'],
      users.mainAcct.accessTokenHeader
    );

    let phst000179s3FileContents = await fence.do.getFileFromSignedUrlRes(
      signedUrls3phs000179Res);
    let phst000179gsFileContents = await fence.do.getFileFromSignedUrlRes(
      signedUrlgsPhs000179Res);

    chai.expect(phst000179s3FileContents,
      `User ${users.mainAcct.username} WITHOUT access COULD create s3 signed urls ` +
      'and read file for a record in unauthorized dbGaP project phs000179'
    ).to.equal(fence.do.FILE_FROM_URL_ERROR);
    chai.expect(phst000179gsFileContents,
      `User ${users.mainAcct.username} WITHOUT access COULD create gs signed urls ` +
      'and read file for a record in unauthorized dbGaP project phs000179'
    ).to.equal(fence.do.FILE_FROM_URL_ERROR);

    // request an UPLOAD presigned URL from fence
    let fenceUploadRes = await fence.do.getUploadUrlForExistingFile(
        indexed_files.phs000178File.did, users.mainAcct.accessTokenHeader
    );
    // fence should not let this user upload
    fence.ask.hasNoUrl(fenceUploadRes);
    fence.ask.assertStatusCode(fenceUploadRes, 401,
      `User ${users.mainAcct.username} should not be able to upload for dbgap ` +
      'project phs000178, even though they have read access.'
    );
});

Scenario('dbGaP + user.yaml Sync: ensure combined access @dbgapSyncing @reqGoogle',
  async (fence, indexd, users, files) => {
    console.log('Running usersync job and adding dbgap sync to yaml sync');
    bash.runJob('usersync', args='ADD_DBGAP true FORCE true');

    // users.mainAcct has access to phs000178 through dbgap
    console.log('Use mainAcct to create s3 signed URL for file phs000178')
    const signedUrls3phs000178Res = await fence.do.createSignedUrl(
      indexed_files.phs000178File.did, ['protocol=s3'],
      users.mainAcct.accessTokenHeader
    );

    // users.mainAcct has access to QA through user.yaml
    console.log('Use mainAcct to create s3 signed URL for file QA')
    const signedUrlsQARes = await fence.do.createSignedUrl(
      indexed_files.QAFile.did, ['protocol=s3'],
      users.mainAcct.accessTokenHeader
    );

    let phs000178s3FileContents = await fence.do.getFileFromSignedUrlRes(
      signedUrls3phs000178Res);
    let QAFileContents = await fence.do.getFileFromSignedUrlRes(
      signedUrlsQARes);

    chai.expect(phs000178s3FileContents,
      `User ${users.mainAcct.username} with access could NOT create s3 signed urls ` +
      'and read file for a record in authorized dbGaP project phs000178'
    ).to.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
    chai.expect(QAFileContents,
      `User ${users.mainAcct.username} with access could NOT create s3 signed urls ` +
      'and read file for a record in authorized program QA'
    ).to.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
});

Scenario('dbGaP + user.yaml Sync (from prev test): ensure user without dbGap access cannot create/update/delete dbGaP indexd records @dbgapSyncing',
  async (fence, indexd, users, files) => {
    console.log('populating guids for indexd records to attempt to create...');
    // populate new GUIDs per test
    const dbgapFooBarFileGuid = uuid.v4().toString();
    new_dbgap_records.fooBarFile.did = dbgapFooBarFileGuid;

    // create
    const dbgap_create_success = await indexd.do.addFileIndices(
        Object.values(new_dbgap_records), users.user2.accessTokenHeader
    );

    // read to test creation
    const dbgap_read_response = await indexd.do.getFileFullRes(
        new_dbgap_records.fooBarFile, users.user2.accessTokenHeader
    );

    // asserts for read to test creation
    fence.ask.assertStatusCode(
        dbgap_read_response, 404,
        msg='should have gotten 404 for reading record under `/dbgap` (no permission to create so it was not created)'
    );

    // force creation of records
    const dbgap_force_create_success = await indexd.do.addFileIndices(
        Object.values(new_dbgap_records)
    );
    chai.expect(
      dbgap_force_create_success, 'unable to force add files to indexd as part of setup'
    ).to.be.true;

    // read again
    const dbgap_read_response_after_force_create = await indexd.do.getFileFullRes(
        new_dbgap_records.fooBarFile, users.user2.accessTokenHeader
    );

    // asserts for read
    fence.ask.assertStatusCode(
        dbgap_read_response_after_force_create, 200,
        msg='should have gotten authorized 200 for reading record under `/dbgap`'
    );

    // update
    const filename_change = {
      'file_name': 'test_filename'
    };
    const dbgap_update_response = await indexd.do.updateFile(
        new_dbgap_records.fooBarFile, filename_change, users.user2.accessTokenHeader
    );

    // asserts for update
    chai.expect(
      dbgap_update_response,
      'should NOT have got successful response when updating record under `/dbgap`'
    ).to.not.have.property('did');

    // delete
    const dbgap_delete_response = await indexd.do.deleteFile(
        new_dbgap_records.fooBarFile, users.user2.accessTokenHeader
    );

    // asserts for delete
    indexd.ask.deleteFileNotSuccessful(
      dbgap_delete_response,
      new_dbgap_records.fooBarFile,
      msg='should have gotten unauthorized for deleting record under `/dbgap`'
    );
});
