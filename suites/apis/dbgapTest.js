/*eslint-disable */
Feature('dbgapSyncing @requires-fence @requires-indexd @e2e').retry(2);
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

const chai = require('chai');
const uuid = require('uuid');
const { Commons } = require('../../utils/commons.js');
const { Bash } = require('../../utils/bash.js');
const apiUtil = require('../../utils/apiUtil.js');
const fenceProps = require('../../services/apis/fence/fenceProps.js');

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
      `gs://${fenceProps.googleBucketInfo.test.bucketId}/${fenceProps.googleBucketInfo.test.fileName}`,
    ],
    md5: '73d643ec3f4beb9020eef0beed440ad0',
    authz: ['/programs/phs000178'],
    size: 9,
  },
  // NOTE: phs000179 should be configured in the Fence Configuration Mapping to point
  //       to a namespaces `orgA` and `orgB`. This is to test the case where a single
  //       study has data in multiple different authorization namespaces
  //
  // FENCE CONFIG SHOULD CONTAIN:
  //
  //    dbGaP:
  //      ...
  //      study_to_resource_namespaces:
  //        '_default': ['/']
  //        'phs000179': ['/orgA/', '/orgB/']
  phs000179File: {
    filename: 'testdata',
    urls: [
      's3://cdis-presigned-url-test/testdata',
      `gs://${fenceProps.googleBucketInfo.QA.bucketId}/${fenceProps.googleBucketInfo.QA.fileName}`,
    ],
    md5: '73d643ec3f4beb9020eef0beed440ad1',
    authz: ['/orgA/programs/phs000179'],
    size: 10,
  },
  anotherPhs000179File: {
    filename: 'testdata',
    urls: [
      's3://cdis-presigned-url-test/testdata',
      `gs://${fenceProps.googleBucketInfo.QA.bucketId}/${fenceProps.googleBucketInfo.QA.fileName}`,
    ],
    md5: '73d643ec3f4beb9020eef0beed440ad2',
    authz: ['/orgB/programs/phs000179'],
    size: 11,
  },
  childPhs000571File: {
    filename: 'cascauth',
    urls: [
      's3://cdis-presigned-url-test/testdata'
    ],
    md5: '73d643ec3f4beb9020eef0beed440ad2',
    authz: ['/programs/phs000571'],
    size: 11,
  },
  QAFile: {
    filename: 'testdata',
    urls: [
      's3://cdis-presigned-url-test/testdata',
      `gs://${fenceProps.googleBucketInfo.QA.bucketId}/${fenceProps.googleBucketInfo.QA.fileName}`,
    ],
    md5: '73d643ec3f4beb9020eef0beed440ac5',
    authz: ['/gen3/programs/QA/projects/foobar'],
    size: 12,
  },
};

const new_dbgap_records = {
  fooBarFile: {
    filename: 'testdata',
    link: 's3://cdis-presigned-url-test/testdata',
    md5: '73d643ec3f4beb9020eef0beed440ad4',
    authz: ['/programs/phs000178'],
    size: 13,
  },
};

BeforeSuite(async ({ fence, users, indexd }) => {
    console.log('Removing test indexd records if they exist');
    await indexd.do.deleteFileIndices(Object.values(indexed_files));
    await indexd.do.deleteFileIndices(Object.values(new_dbgap_records));

    console.log('Adding indexd files used to test signed urls');
    const ok = await indexd.do.addFileIndices(Object.values(indexed_files));
    chai.expect(
      ok, 'unable to add files to indexd as part of dbgapTest setup',
    ).to.be.true;

    console.log('Running usersync job and forcing only dbgap sync');
    console.log(`start time: ${Math.floor(Date.now() / 1000)}`);
    bash.runJob('usersync', args = 'FORCE true ONLY_DBGAP true');
    console.log(`end time: ${Math.floor(Date.now() / 1000)}`);

    // // Google signed urls are testing for dbgap syncing as well, link phs ids to
    // // existing buckets
    // let { bucketId } = fenceProps.googleBucketInfo.QA;
    // var fenceCmd = `fence-create link-bucket-to-project --project_auth_id phs000179 --bucket_id ${bucketId} --bucket_provider google`;
    // console.log(`Running: ${fenceCmd}`);
    // bash.runCommand(fenceCmd, 'fence');
    //
    // // Google signed urls are testing for dbgap syncing as well, link phs ids to
    // // existing buckets
    // bucketId = fenceProps.googleBucketInfo.test.bucketId;
    // var fenceCmd = `fence-create link-bucket-to-project --project_auth_id phs000178 --bucket_id ${bucketId} --bucket_provider google`;
    // console.log(`Running: ${fenceCmd}`);
    // bash.runCommand(fenceCmd, 'fence');
});

AfterSuite(async ({ fence, indexd, users }) => {
  try {
    console.log('Removing indexd files used to test signed urls');
    await indexd.do.deleteFileIndices(Object.values(indexed_files));
    await indexd.do.deleteFileIndices(Object.values(new_dbgap_records));

    console.log('Running usersync after dbgap testing');
    console.log(`start time: ${Math.floor(Date.now() / 1000)}`);
    bash.runJob('usersync', args = 'FORCE true');
    console.log(`end time: ${Math.floor(Date.now() / 1000)}`);
  } catch (error) {
    console.log(error);
  }
});

Scenario('dbGaP Sync: created signed urls (from s3 and gs) to download, try creating urls to upload @dbgapSyncing @reqGoogle',
  async ({ I, fence, users }) => {
    // ASSUME BeforeSuite has run the ONLY_DBGAP usersync
    // users.mainAcct has access to phs000178
    console.log('Use mainAcct to create s3 signed URL for file phs000178');
    const signedUrls3phs000178Res = await fence.do.createSignedUrl(
      indexed_files.phs000178File.did, ['protocol=s3'],
      users.mainAcct.accessTokenHeader,
    );
    console.log('Use mainAcct to create gs signed URL for file phs000178');
    const signedUrlgsPhs000178Res = await fence.do.createSignedUrl(
      indexed_files.phs000178File.did, ['protocol=gs'],
      users.mainAcct.accessTokenHeader,
    );

    console.log('Use mainAcct to create s3 signed URL for file phs000571');
    const signedUrls3Phs000571Res = await fence.do.createSignedUrl(
      indexed_files.childPhs000571File.did, ['protocol=s3'],
      users.mainAcct.accessTokenHeader,
    );

    console.log('Use mainAcct to create gs signed URL for file phs000571');
    const signedUrlgsPhs000571Res = await fence.do.createSignedUrl(
      indexed_files.childPhs000571File.did, ['protocol=gs'],
      users.mainAcct.accessTokenHeader,
    );

    let phs000178s3FileContents = null;
    let phs000178gsFileContents = null;
    console.log(Date.now());
    await apiUtil.sleepMS(60000);
    console.log(Date.now());
    try {
      phs000178s3FileContents = await fence.do.getFileFromSignedUrlRes(
        signedUrls3phs000178Res,
      );
    } catch (err) {
      const url = signedUrls3phs000178Res && signedUrls3phs000178Res.data && signedUrls3phs000178Res.data.url;
      console.log(`Failed to fetch signed url ${url}`, err);
      chai.assert.fail(`Failed to fetch signed url ${url}`);
    }
    try {
      phs000178gsFileContents = await fence.do.getFileFromSignedUrlRes(
        signedUrlgsPhs000178Res,
      );
    } catch (err) {
      const url = signedUrlgsPhs000178Res && signedUrlgsPhs000178Res.data && signedUrlgsPhs000178Res.data.url;
      console.log(`Failed to fetch signed url ${url}`, err);
      chai.assert.fail(`Failed to fetch signed url ${url}`);
    }

    chai.expect(phs000178s3FileContents,
      `User ${users.mainAcct.username} with access could NOT create s3 signed urls `
      + 'and read file for a record in authorized dbGaP project phs000178').to.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
    chai.expect(phs000178gsFileContents,
      `User ${users.mainAcct.username} with access could NOT create gs signed urls `
      + 'and read file for a record in authorized dbGaP project phs000178').to.equal(fence.props.googleBucketInfo.test.fileContents);

    // users.mainAcct does NOT have access to phs000179
    console.log('Use mainAcct to create s3 signed URL for phs000179 file in orgA namespace');
    const signedUrls3phs000179Res = await fence.do.createSignedUrl(
      indexed_files.phs000179File.did, ['protocol=s3'],
      users.mainAcct.accessTokenHeader,
    );
    console.log('Use mainAcct to create s3 signed URL for phs000179 file in orgB namespace');
    const signedUrls3anotherPhs000179FileRes = await fence.do.createSignedUrl(
      indexed_files.anotherPhs000179File.did, ['protocol=s3'],
      users.mainAcct.accessTokenHeader,
    );
    console.log('Use mainAcct to create gs signed URL for file phs000179 in orgA namespace');
    const signedUrlgsPhs000179Res = await fence.do.createSignedUrl(
      indexed_files.phs000179File.did, ['protocol=gs'],
      users.mainAcct.accessTokenHeader,
    );
    console.log('Use mainAcct to create gs signed URL for phs000179 file in orgB namespace');
    const signedUrlgsAnotherPhs000179FileRes = await fence.do.createSignedUrl(
      indexed_files.anotherPhs000179File.did, ['protocol=gs'],
      users.mainAcct.accessTokenHeader,
    );
    const signedUrls3phs000571Res = await fence.do.createSignedUrl(
      indexed_files.childPhs000571File.did, ['protocol=s3'],
      users.mainAcct.accessTokenHeader,
    );
    const phs000179s3FileContents = await fence.do.getFileFromSignedUrlRes(
      signedUrls3phs000179Res,
    );
    const phs000571s3FileContents = await fence.do.getFileFromSignedUrlRes(
      signedUrls3phs000571Res,
    );
    const anotherPhs000179s3FileContents = await fence.do.getFileFromSignedUrlRes(
      signedUrls3anotherPhs000179FileRes,
    );
    const phs000179gsFileContents = await fence.do.getFileFromSignedUrlRes(
      signedUrlgsPhs000179Res,
    );
    const anotherPhs000179gsFileContents = await fence.do.getFileFromSignedUrlRes(
      signedUrlgsAnotherPhs000179FileRes,
    );

    chai.expect(phs000179s3FileContents,
      `User ${users.mainAcct.username} WITHOUT access COULD create s3 signed urls `
      + 'and read file for a record in unauthorized dbGaP project phs000179 in namespace orgA').to.equal(fence.props.FILE_FROM_URL_ERROR);
    chai.expect(anotherPhs000179s3FileContents,
      `User ${users.mainAcct.username} WITHOUT access COULD create s3 signed urls `
      + 'and read file for a record in unauthorized dbGaP project phs000179 in namespace orgB').to.equal(fence.props.FILE_FROM_URL_ERROR);
    chai.expect(phs000179gsFileContents,
      `User ${users.mainAcct.username} WITHOUT access COULD create gs signed urls `
      + 'and read file for a record in unauthorized dbGaP project phs000179 in namespace orgA').to.equal(fence.props.FILE_FROM_URL_ERROR);
    chai.expect(anotherPhs000179gsFileContents,
      `User ${users.mainAcct.username} WITHOUT access COULD create gs signed urls `
      + 'and read file for a record in unauthorized dbGaP project phs000179 in namespace orgB').to.equal(fence.props.FILE_FROM_URL_ERROR);

    // request an UPLOAD presigned URL from fence
    const fenceUploadRes = await fence.do.getUploadUrlForExistingFile(
      indexed_files.phs000178File.did, users.mainAcct.accessTokenHeader,
    );
    // fence should not let this user upload
    fence.ask.hasNoUrl(fenceUploadRes);
    fence.ask.assertStatusCode(fenceUploadRes, 401,
      `User ${users.mainAcct.username} should not be able to upload for dbgap `
      + 'project phs000178, even though they have read access.');
}).retry(1);

Scenario('dbGaP + user.yaml Sync: ensure combined access @dbgapSyncing @reqGoogle',
  async ({ fence, users }) => {
    console.log('Running usersync job and adding dbgap sync to yaml sync');
    console.log(`start time: ${Math.floor(Date.now() / 1000)}`);
    bash.runJob('usersync', args = 'ADD_DBGAP true FORCE true');
    console.log(`end time: ${Math.floor(Date.now() / 1000)}`);

    // users.mainAcct has access to phs000178 through dbgap
    console.log('Use mainAcct to create s3 signed URL for file phs000178');
    const signedUrls3phs000178Res = await fence.do.createSignedUrl(
      indexed_files.phs000178File.did, ['protocol=s3'],
      users.mainAcct.accessTokenHeader,
    );

    // users.mainAcct has access to QA through user.yaml
    console.log('Use mainAcct to create s3 signed URL for file QA');
    const signedUrlsQARes = await fence.do.createSignedUrl(
      indexed_files.QAFile.did, ['protocol=s3'],
      users.mainAcct.accessTokenHeader,
    );

    const phs000178s3FileContents = await fence.do.getFileFromSignedUrlRes(
      signedUrls3phs000178Res,
    );
    const QAFileContents = await fence.do.getFileFromSignedUrlRes(
      signedUrlsQARes,
    );

    chai.expect(phs000178s3FileContents,
      `User ${users.mainAcct.username} with access could NOT create s3 signed urls `
      + 'and read file for a record in authorized dbGaP project phs000178').to.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
    chai.expect(QAFileContents,
      `User ${users.mainAcct.username} with access could NOT create s3 signed urls `
      + 'and read file for a record in authorized program QA').to.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
}).retry(1);

Scenario('dbGaP + user.yaml Sync (from prev test): ensure user without dbGap access cannot create/update/delete dbGaP indexd records @dbgapSyncing @reqGoogle',
  async ({ fence, indexd, users }) => {
    console.log('populating guids for indexd records to attempt to create...');
    // populate new GUIDs per test
    const dbgapFooBarFileGuid = uuid.v4().toString();
    new_dbgap_records.fooBarFile.did = dbgapFooBarFileGuid;

    // create
    const dbgap_create_success = await indexd.do.addFileIndices(
      Object.values(new_dbgap_records), users.user2.accessTokenHeader,
    );

    // read to test creation
    const dbgap_read_response = await indexd.do.getFileFullRes(
      new_dbgap_records.fooBarFile, users.user2.accessTokenHeader,
    );

    // asserts for read to test creation
    fence.ask.assertStatusCode(
      dbgap_read_response, 404,
      msg = 'should have gotten 404 for reading dbgap record (no permission to create so it was not created)',
    );

    // force creation of records
    const dbgap_force_create_success = await indexd.do.addFileIndices(
      Object.values(new_dbgap_records),
    );
    chai.expect(
      dbgap_force_create_success, 'unable to force add files to indexd as part of setup',
    ).to.be.true;

    // read again
    const dbgap_read_response_after_force_create = await indexd.do.getFileFullRes(
      new_dbgap_records.fooBarFile, users.user2.accessTokenHeader,
    );

    // asserts for read
    fence.ask.assertStatusCode(
      dbgap_read_response_after_force_create, 200,
      msg = 'should have gotten authorized 200 for reading dbgap record',
    );

    // update
    const filename_change = {
      file_name: 'test_filename',
    };
    const dbgap_update_response = await indexd.do.updateFile(
      new_dbgap_records.fooBarFile, filename_change, users.user2.accessTokenHeader,
    );

    // asserts for update
    chai.expect(
      dbgap_update_response,
      'should NOT have got successful response when updating dbgap record',
    ).to.not.have.property('did');

    // delete
    const dbgap_delete_response = await indexd.do.deleteFile(
      new_dbgap_records.fooBarFile, users.user2.accessTokenHeader,
    );

    // asserts for delete
    indexd.ask.deleteFileNotSuccessful(
      dbgap_delete_response,
      new_dbgap_records.fooBarFile,
      msg = 'should have gotten unauthorized for deleting dbgap record',
    );
}).retry(1);

Scenario('dbGaP + user.yaml Sync (from prev test): ensure users with dbGap access cannot create/update/delete dbGaP indexd records @dbgapSyncing @reqGoogle',
  async ({ fence, indexd, users }) => {
    console.log('populating guids for indexd records to attempt to create...');
    // populate new GUIDs per test
    const dbgapFooBarFileGuid = uuid.v4().toString();
    new_dbgap_records.fooBarFile.did = dbgapFooBarFileGuid;

    // create
    const dbgap_create_success = await indexd.do.addFileIndices(
      Object.values(new_dbgap_records), users.mainAcct.accessTokenHeader,
    );

    // read to test creation
    const dbgap_read_response = await indexd.do.getFileFullRes(
      new_dbgap_records.fooBarFile, users.mainAcct.accessTokenHeader,
    );

    // asserts for read to test creation
    fence.ask.assertStatusCode(
      dbgap_read_response, 404,
      msg = 'should have gotten 404 for reading dbgap record (no permission to create so it was not created)',
    );

    // force creation of records
    const dbgap_force_create_success = await indexd.do.addFileIndices(
      Object.values(new_dbgap_records),
    );
    chai.expect(
      dbgap_force_create_success, 'unable to force add files to indexd as part of setup',
    ).to.be.true;

    // read again
    const dbgap_read_response_after_force_create = await indexd.do.getFileFullRes(
      new_dbgap_records.fooBarFile, users.mainAcct.accessTokenHeader,
    );

    // asserts for read
    fence.ask.assertStatusCode(
      dbgap_read_response_after_force_create, 200,
      msg = 'should have gotten authorized 200 for reading dbgap record',
    );

    // update
    const filename_change = {
      file_name: 'test_filename',
    };
    const dbgap_update_response = await indexd.do.updateFile(
      new_dbgap_records.fooBarFile, filename_change, users.mainAcct.accessTokenHeader,
    );

    // asserts for update
    chai.expect(
      dbgap_update_response,
      'should NOT have got successful response when updating dbgap record',
    ).to.not.have.property('did');

    // delete
    const dbgap_delete_response = await indexd.do.deleteFile(
      new_dbgap_records.fooBarFile, users.mainAcct.accessTokenHeader,
    );

    // asserts for delete
    indexd.ask.deleteFileNotSuccessful(
      dbgap_delete_response,
      new_dbgap_records.fooBarFile,
      msg = 'should have gotten unauthorized for deleting dbgap record',
    );
}).retry(1);
