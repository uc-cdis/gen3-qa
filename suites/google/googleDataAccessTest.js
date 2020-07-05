/*eslint-disable */
Feature('GoogleDataAccess');
/*
Test a full flow for a user accessing data on Google. Also test that when permissions
change on the User Access file, the user's access to data on Google changes correctly.

- Sync a User Access File
- Generate temporary Google credentials
- Generate signed URLs
- Use credentials and signed URLs to read file(s)
  - make sure they get 403's for files users should NOT have access
  - make sure they CAN receive the files that they should

User Access Files and which projects the users have access to:

  Normal usersync against common-users qa/user.yaml =>
    User0
      - QA
    User1
      - QA
      - test
    User2
      -

  Commons.userAccessFiles.newUserAccessFile2 =>
    User0
      -
    User1
      - test
    User2
      - QA
*/

const chai = require('chai');
const { Commons } = require('../../utils/commons.js');
const fenceProps = require('../../services/apis/fence/fenceProps.js');
const { Bash } = require('../../utils/bash.js');
const {
  checkPod,
  getAccessToken,
  getAccessTokenHeader,
  Gen3Response,
  sleepMS,
} = require('../../utils/apiUtil.js');

const bash = new Bash();

const fs = require('fs');
const stringify = require('json-stringify-safe');

const indexed_files = {
  qaFile: {
    filename: fenceProps.googleBucketInfo.QA.fileName,
    link: `gs://${fenceProps.googleBucketInfo.QA.bucketId}/${fenceProps.googleBucketInfo.QA.fileName}`,
    md5: '73d643ec3f4beb9020eef0beed440ad0',
    acl: ['QA'],
    size: 9,
  },
  testFile: {
    filename: fenceProps.googleBucketInfo.test.fileName,
    link: `gs://${fenceProps.googleBucketInfo.test.bucketId}/${fenceProps.googleBucketInfo.test.fileName}`,
    md5: '73d643ec3f4beb9020eef0beed440ad1',
    acl: ['test'],
    size: 10,
  },
};

BeforeSuite(async (indexd) => {
  console.log('Adding indexd files used to test signed urls');
  const ok = await indexd.do.addFileIndices(Object.values(indexed_files));
  chai.expect(ok).to.be.true;
});

AfterSuite(async (fence, indexd, users) => {
  console.log('Removing indexd files used to test signed urls');
  await indexd.do.deleteFileIndices(Object.values(indexed_files));
});

Before(async (google, fence, users) => {
  // Cleanup before each scenario
  console.log('deleting keys for SA associated with users 0, 1 and user2...');
  ['user0', 'user1', 'user2'].forEach(async(user) => {
    const getCredsRes = await fence.do.getUserGoogleCreds(users[user].accessTokenHeader);
    await google.deleteSAKeys(user, getCredsRes.access_keys);
  });
});

After(async (fence, users) => {
  // Cleanup after each scenario
  const unlinkResults = Object.values(users).map(async(user) => {
    fence.do.unlinkGoogleAcct(user);
  });
  await Promise.all(unlinkResults);
  console.log('Running usersync job');
  bash.runJob('usersync', args = 'FORCE true');
  await checkPod('usersync', 'gen3job,job-name=usersync');
});

Scenario('Test Google Data Access user0 (signed urls and temp creds) @reqGoogle @googleDataAccess',
  async (I, fence, indexd, users, google, files) => {
    console.log(`Double-check if file ${indexed_files.qaFile.did} is indexed. If it isn't fail fast.`);
    const indexdLookupRes = await indexd.do.getFile(indexed_files.qaFile, users.user0.accessTokenHeader);
    chai.expect(indexdLookupRes,
      `First sync: Check if the [indexed_files.qaFile] (${indexed_files.qaFile.filename}) has been indexed. Otherwise fail fast.`).to.have.property('file_name', indexed_files.qaFile.filename);

    let User0signedUrlQA1Res = '';
    let tempCreds0Res = '';

    console.log('make sure google account user0 is unlinked');
    const unlinkResult = await fence.complete.forceUnlinkGoogleAcct(users.user0);
    console.log(`users.user0.accessTokenHeader: ${JSON.stringify(users.user0.accessTokenHeader)}`);

    console.log(`creating temporary google creds for user0 with username:  ${users.user0.username}`);
    // call our endpoint to get temporary creds
    // NOTE: If this fails and you don't know why, it *might* be that we've hit our limit
    //       for SA keys on this user's Google Service Account. They *should* be cleaned
    //       up after every test but if they aren't, you need to delete the keys from the
    //       fence database (in table google_service_account_keys) AND delete them from
    //       the Google Cloud Platform. Check usersUtil.js for information about these users
    //       (specifically their username is their Google Account email, you can use that
    //        to find their service account in the GCP)
    tempCreds0Res= await fence.complete.createTempGoogleCreds(
      users.user0.accessTokenHeader,
    );

    console.log(`tempCreds0Res: ${JSON.stringify(tempCreds0Res)}`);

    console.log('linking user0 google accounts');
    const linkResult0 = await fence.complete.linkGoogleAcctMocked(users.user0);
    console.log(`linkResult0: ${JSON.stringify(linkResult0)}`);

    console.log(`users.user0.accessTokenHeader again: ${JSON.stringify(users.user0.accessTokenHeader)}`);
    console.log(`Use User0 to create signed URL for file in QA.`);
    User0signedUrlQA1Res = await fence.do.createSignedUrlForUser(
        indexed_files.qaFile.did, users.user0.accessTokenHeader,
    );

    console.log(`User0signedUrlQA1Res: ${JSON.stringify(User0signedUrlQA1Res)}`);
    const User0signedUrlQA1FileContents = await I.sendGetRequest(
      User0signedUrlQA1Res.data.url,
    ).then((res) => new Gen3Response(res));

    if (User0signedUrlQA1FileContents.data.length > 20) {
      console.log(`The contents of the QA file: ${stringify(User0signedUrlQA1FileContents.data).substring(User0signedUrlQA1FileContents.data.length-100, User0signedUrlQA1FileContents.data.length)}`);
    } else {
      console.log(`The contents of the QA file: ${User0signedUrlQA1FileContents.data}`);
    }

    if (User0signedUrlQA1FileContents.data == fence.props.googleBucketInfo.QA.fileContents) {
       console.log(`a valid presigned url has been created.`);
       console.log(`${new Date()}: The contents of the QA file: ${User0signedUrlQA1FileContents.data}`);
    } else {
      console.log(`Failed to create a valid presigned url.`);
    }

    console.log('Use User0 to create signed URL for file in test');
    const User0signedUrlTest1Res = await fence.do.createSignedUrlForUser(
      indexed_files.testFile.did, users.user0.accessTokenHeader,
    );

    console.log(`${new Date()}: The contents of the QA file: ${User0signedUrlQA1FileContents.data}`);
    // Pick up temp creds created earlier in the retry loop above
    console.log(`tempCreds0Res: ${JSON.stringify(tempCreds0Res)}`);

    console.log('saving temporary google creds to file');
    const creds0Key = tempCreds0Res.data.private_key_id;
    const pathToCreds0KeyFile = `${creds0Key}.json`;

    await files.createTmpFile(pathToCreds0KeyFile, JSON.stringify(tempCreds0Res.data));
    console.log(`Google creds file ${pathToCreds0KeyFile} saved!`);

    console.log('using saved google creds to access google bucket!! Save responses to check later');
    // use Google's client libraries to attempt to read a controlled access file with the
    // creds we just saved (based on the user's permissions)
    // attempt to access a file in the bucket
    user0AccessQA1Res = await google.getFileFromBucket(
      fence.props.googleBucketInfo.QA.googleProjectId,
      pathToCreds0KeyFile,
      fence.props.googleBucketInfo.QA.bucketId,
      fence.props.googleBucketInfo.QA.fileName,
    );
    user0AccessTest1Res = await google.getFileFromBucket(
      fence.props.googleBucketInfo.test.googleProjectId,
      pathToCreds0KeyFile,
      fence.props.googleBucketInfo.test.bucketId,
      fence.props.googleBucketInfo.test.fileName,
      { nAttempts: 5, expectAccessDenied: true },
    );

    // FIRST RUN
    //  - Check Temporary Service Account Creds
    console.log('Make assertions for user access for first run');
    console.log('First: Check temporary service account credentials');

    console.log(`user0AccessQA1Res - Should work: ${JSON.stringify(user0AccessQA1Res)}`);
    chai.expect(user0AccessQA1Res,
      `First sync: Check User0 access bucket for project: QA. FAILED.`).to.have.property('id');
    console.log(`user0AccessTest1Res - Should fail: ${JSON.stringify(user0AccessTest1Res)}`);
    chai.expect(user0AccessTest1Res,
      `First sync: Check User0 CAN NOT access bucket for project: test.`).to.have.property('status', 403);

    // FIRST RUN
    //  - Check Signed URLs - BEGIN
    console.log('Second: Check signed URLs');

    chai.expect(User0signedUrlQA1FileContents.data,
      `First sync: Check User0 can use signed URL to read file in QA. FAILED.`).to.equal(fence.props.googleBucketInfo.QA.fileContents);
    chai.expect(User0signedUrlTest1Res,
      `First sync: Check that User0 could NOT get a signed URL to read file in test.`).to.have.property('status', 401);
    //  - Check Signed URLs - END

    // Applying a new user.yaml to revoke QA access from users 0 and 1 and grant it to user2
    console.log(`Running useryaml job with ${Commons.userAccessFiles.newUserAccessFile2}`);
    Commons.setUserYaml(Commons.userAccessFiles.newUserAccessFile2);
    bash.runJob('useryaml');
    await checkPod('useryaml', 'gen3job,job-name=useryaml');

    // Maybe we need to wait a bit for Fence to talk to Google
    // and make sure the user's access has been revoked
    await sleepMS(20000)

    // get new access tokens b/c of changed access
    newUser0AccessToken = getAccessToken(users.user0.username, 3600);

    console.log('using saved google creds to access google bucket!! Save responses to check later');
    // use Google's client libraries to attempt to read a controlled access file with the
    // creds we just saved (based on the user's permissions)
    // attempt to access a file in the bucket
    user0AccessQA2Res = await google.getFileFromBucket(
      fence.props.googleBucketInfo.QA.googleProjectId,
      pathToCreds0KeyFile,
      fence.props.googleBucketInfo.QA.bucketId,
      fence.props.googleBucketInfo.QA.fileName,
      { nAttempts: 5, expectAccessDenied: true },
    );
    user0AccessTest2Res = await google.getFileFromBucket(
      fence.props.googleBucketInfo.test.googleProjectId,
      pathToCreds0KeyFile,
      fence.props.googleBucketInfo.test.bucketId,
      fence.props.googleBucketInfo.test.fileName,
      { nAttempts: 5, expectAccessDenied: true },
    );

    console.log(`${new Date()}: user0AccessQA2Res: ${JSON.stringify(user0AccessQA2Res)}`);

    console.log('Use User0 to create signed URL for file in QA');
    const User0signedUrlQA2Res = await fence.do.createSignedUrlForUser(
      indexed_files.qaFile.did, getAccessTokenHeader(newUser0AccessToken),
    );

    console.log('Use User0 to create signed URL for file in test');
    const User0signedUrlTest2Res = await fence.do.createSignedUrlForUser(
      indexed_files.testFile.did, getAccessTokenHeader(newUser0AccessToken),
    );

    // use old signed urls to try and access data again
    console.log('Use signed URL from User0 to try and access QA data again');
    const User0AccessRemovedQA = await I.sendGetRequest(
      User0signedUrlQA1Res.data.url,
    ).then((res) => new Gen3Response(res));

    console.log('deleting temporary google credentials');
    // call our endpoint to delete temporary creds
    const deleteCreds0Res = await fence.do.deleteTempGoogleCreds(
      creds0Key, users.user0.accessTokenHeader,
    );

    console.log('test cleanup: deleting google service accounts from google');
    const deleteServiceAccount0Res = await google.deleteServiceAccount(
      tempCreds0Res.data.client_email, tempCreds0Res.data.project_id,
    );

    console.log('deleting temporary google credentials file');
    if (files.fileExists(pathToCreds0KeyFile)) {
      files.deleteFile(pathToCreds0KeyFile);
      console.log(`${pathToCreds0KeyFile} deleted!`);
    }

    // SECOND RUN (new authZ)
    //  - Check Temporary Service Account Creds
    console.log('Make assertions for user access for second run (after new usersync)');
    console.log('First: Check temporary service account credentials');

    chai.expect(user0AccessQA2Res,
      '2nd sync: Check User0 CAN NOT access bucket for project: QA. FAILED.').to.have.property('status', 403);
    chai.expect(user0AccessTest2Res,
      '2nd sync: Check User0 CAN NOT access bucket for project: test. FAILED.').to.have.property('status', 403);

    // SECOND RUN (new authZ)
    //  - Check Signed URLs from SECOND RUN
    console.log('Second: Check signed URLs');

    chai.expect(User0signedUrlQA2Res,
      '2nd sync: Check that User0 could NOT get a signed URL to read file in QA. FAILED.').to.have.property('status', 401);

    chai.expect(User0signedUrlTest2Res,
      '2nd sync: Check that User0 could NOT get a signed URL to read file in test. FAILED.').to.have.property('status', 401);

    // SECOND RUN
    //  - Check signed URLs from FIRST RUN
    chai.expect(User0AccessRemovedQA.data,
      'Make sure signed URL from User0 CANNOT access QA data again. FAILED.').to.contain('AccessDenied');

    // CLEANUP
    console.log('Finally: Ensure cleanup as successful');

    chai.expect(deleteCreds0Res,
      'Cleanup of temporary Google creds for User 0 FAILED.').to.have.property('status', 204);

    chai.expect(deleteServiceAccount0Res,
      'Cleanup of Google service account for User 0 FAILED.').to.be.empty;
  }
);

Scenario('Test Google Data Access user1 (signed urls and temp creds) @reqGoogle @googleDataAccess',
  async (I, fence, users, google, files) => {
    console.log('make sure google account user1 is unlinked');
    await fence.complete.forceUnlinkGoogleAcct(users.user1);

    console.log(`creating temporary google creds for user with username:  ${users.user1.username}`);
    // call our endpoint to get temporary creds
    // NOTE: If this fails and you don't know why, it *might* be that we've hit our limit
    //       for SA keys on this user's Google Service Account. They *should* be cleaned
    //       up after every test but if they aren't, you need to delete the keys from the
    //       fence database (in table google_service_account_keys) AND delete them from
    //       the Google Cloud Platform. Check usersUtil.js for information about these users
    //       (specifically their username is their Google Account email, you can use that
    //        to find their service account in the GCP)
    const tempCreds1Res = await fence.complete.createTempGoogleCreds(
      users.user1.accessTokenHeader,
    );
    console.log(`tempCreds1Res: ${JSON.stringify(tempCreds1Res)}`);

    console.log('linking user1 google accounts');
    const linkResult1 = await fence.complete.linkGoogleAcctMocked(users.user1);
    console.log(`linkResult1: ${JSON.stringify(linkResult1)}`);

    console.log('Use User1 to create signed URL for file in QA');
    const User1signedUrlQA1Res = await fence.do.createSignedUrlForUser(
      indexed_files.qaFile.did, users.user1.accessTokenHeader,
    );
    console.log(`User1signedUrlQA1Res: ${JSON.stringify(User1signedUrlQA1Res)}`);
    const User1signedUrlQA1ResFileContents = await I.sendGetRequest(
      User1signedUrlQA1Res.data.url,
    ).then((res) => new Gen3Response(res));

    console.log(`User1signedUrlQA1ResFileContents: ${User1signedUrlQA1ResFileContents.data}`);

    console.log('Use User1 to create signed URL for file in test');
    const User1signedUrlTest1Res = await fence.do.createSignedUrlForUser(
      indexed_files.testFile.did, users.user1.accessTokenHeader,
    );
    const User1signedUrlTest1ResFileContents = await I.sendGetRequest(
      User1signedUrlTest1Res.data.url,
    ).then((res) => new Gen3Response(res));

    console.log('saving temporary google creds to file');
    const creds1Key = tempCreds1Res.data.private_key_id;
    const pathToCreds1KeyFile = `${creds1Key}.json`;

    await files.createTmpFile(pathToCreds1KeyFile, JSON.stringify(tempCreds1Res.data));
    console.log(`Google creds file ${pathToCreds1KeyFile} saved!`);

    console.log('using saved google creds to access google bucket!! Save responses to check later');
    // use Google's client libraries to attempt to read a controlled access file with the
    // creds we just saved (based on the user's permissions)
    // attempt to access a file in the bucket
    user1AccessQA1Res = await google.getFileFromBucket(
      fence.props.googleBucketInfo.QA.googleProjectId,
      pathToCreds1KeyFile,
      fence.props.googleBucketInfo.QA.bucketId,
      fence.props.googleBucketInfo.QA.fileName,
    );
    user1AccessTest1Res = await google.getFileFromBucket(
      fence.props.googleBucketInfo.test.googleProjectId,
      pathToCreds1KeyFile,
      fence.props.googleBucketInfo.test.bucketId,
      fence.props.googleBucketInfo.test.fileName,
    );

    console.log(`user1AccessQA1Res: ${JSON.stringify(user1AccessQA1Res)}`);

    // Applying a new user.yaml to revoke QA access from users 0 and 1 and grant it to user2
    console.log(`Running useryaml job with ${Commons.userAccessFiles.newUserAccessFile2}`);
    Commons.setUserYaml(Commons.userAccessFiles.newUserAccessFile2);
    bash.runJob('useryaml');
    await checkPod('useryaml', 'gen3job,job-name=useryaml');

    // Maybe we need to wait a bit for Fence to talk to Google
    // and make sure the user's access has been revoked
    await sleepMS(20000)

    // get new access tokens b/c of changed access
    newUser1AccessToken = getAccessToken(users.user1.username, 3600);

    console.log('using saved google creds to access google bucket!! Save responses to check later');
    // use Google's client libraries to attempt to read a controlled access file with the
    // creds we just saved (based on the user's permissions)
    // attempt to access a file in the bucket
    user1AccessQA2Res = await google.getFileFromBucket(
      fence.props.googleBucketInfo.QA.googleProjectId,
      pathToCreds1KeyFile,
      fence.props.googleBucketInfo.QA.bucketId,
      fence.props.googleBucketInfo.QA.fileName,
      { nAttempts: 5, expectAccessDenied: true },
    );
    user1AccessTest2Res = await google.getFileFromBucket(
      fence.props.googleBucketInfo.test.googleProjectId,
      pathToCreds1KeyFile,
      fence.props.googleBucketInfo.test.bucketId,
      fence.props.googleBucketInfo.test.fileName,
    );

    console.log(`${new Date()}: user1AccessQA2Res: ${JSON.stringify(user1AccessQA2Res)}`);

    console.log('Use User1 to create signed URL for file in QA');
    const User1signedUrlQA2Res = await fence.do.createSignedUrlForUser(
      indexed_files.qaFile.did, getAccessTokenHeader(newUser1AccessToken),
    );

    console.log('Use User1 to create signed URL for file in test');
    const User1signedUrlTest2Res = await fence.do.createSignedUrlForUser(
      indexed_files.testFile.did, getAccessTokenHeader(newUser1AccessToken),
    );
    const User1signedUrlTest2ResFileContents = await I.sendGetRequest(
      User1signedUrlTest2Res.data.url,
    ).then((res) => new Gen3Response(res));

    // use old signed urls to try and access data again
    console.log('Use signed URL from User1 to try and access QA data again');
    const User1AccessRemovedQA = await I.sendGetRequest(
      User1signedUrlQA1Res.data.url,
    ).then((res) => new Gen3Response(res));

    console.log('Use signed URL from User1 to try and access test data again');
    const User1AccessRemainsTest = await I.sendGetRequest(
      User1signedUrlTest1Res.data.url,
    ).then((res) => new Gen3Response(res));

    console.log('deleting temporary google credentials');
    const deleteCreds1Res = await fence.do.deleteTempGoogleCreds(
      creds1Key, users.user1.accessTokenHeader,
    );

    console.log('test cleanup: deleting google service accounts from google');
    const deleteServiceAccount1Res = await google.deleteServiceAccount(
      tempCreds1Res.data.client_email, tempCreds1Res.data.project_id,
    );

    console.log('deleting temporary google credentials file');
    if (files.fileExists(pathToCreds1KeyFile)) {
      files.deleteFile(pathToCreds1KeyFile);
      console.log(`${pathToCreds1KeyFile} deleted!`);
    }

    // FIRST RUN
    //  - Check Temporary Service Account Creds
    console.log('Make assertions for user access for first run');
    console.log('First: Check temporary service account credentials');

    chai.expect(user1AccessQA1Res.metadata,
      'First sync: Check User1 access bucket for project: QA. FAILED.').to.have.property('id');
    chai.expect(user1AccessTest1Res.metadata,
      'First sync: Check User1 access bucket for project: test. FAILED.').to.have.property('id');

    // FIRST RUN
    //  - Check Signed URLs
    console.log('Second: Check signed URLs');

    chai.expect(User1signedUrlQA1ResFileContents.data,
      'First sync: Check User1 can use signed URL to read file in QA. FAILED.').to.equal(fence.props.googleBucketInfo.QA.fileContents);

    chai.expect(User1signedUrlTest1ResFileContents.data,
      'First sync: Check User1 can use signed URL to read file in test. FAILED.').to.equal(fence.props.googleBucketInfo.test.fileContents);

    // SECOND RUN (new authZ)
    //  - Check Temporary Service Account Creds
    console.log('Make assertions for user access for second run (after new usersync)');
    console.log('First: Check temporary service account credentials');

    chai.expect(user1AccessQA2Res,
      '2nd sync: Check User1 CAN NOT access bucket for project: QA. FAILED.').to.have.property('status', 403);
    chai.expect(user1AccessTest2Res,
      '2nd sync: Check User1 access bucket for project: test. FAILED.').to.have.property('id');

    // SECOND RUN (new authZ)
    //  - Check Signed URLs from SECOND RUN
    console.log('Second: Check signed URLs');

    chai.expect(User1signedUrlQA2Res,
      '2nd sync: Check that User1 could NOT get a signed URL to read file in QA. FAILED.').to.have.property('status', 401);

    chai.expect(User1signedUrlTest2ResFileContents.data,
      '2nd sync: Check User1 can use signed URL to read file in test. FAILED.').to.equal(fence.props.googleBucketInfo.test.fileContents);

    // SECOND RUN
    //  - Check signed URLs from FIRST RUN
    chai.expect(User1AccessRemovedQA.data,
      'Make sure signed URL from User1 CANNOT access QA data again. FAILED.').to.contain('AccessDenied');

    chai.expect(User1AccessRemainsTest.data,
      'Make sure signed URL from User1 CAN access test data again. FAILED.').to.equal(fence.props.googleBucketInfo.test.fileContents);

    // CLEANUP
    console.log('Finally: Ensure cleanup as successful');

    chai.expect(deleteCreds1Res,
      'Cleanup of temporary Google creds for User 1 FAILED.').to.have.property('status', 204);

    chai.expect(deleteServiceAccount1Res,
      'Cleanup of Google service account for User 1 FAILED.').to.be.empty;
  }
);

Scenario('Test Google Data Access user2 (signed urls and temp creds) @reqGoogle @googleDataAccess',
  async (I, fence, users, google, files) => {
    console.log('make sure google account user2 is unlinked');
    await fence.complete.forceUnlinkGoogleAcct(users.user2);

    console.log('linking user2 google account');
    const linkResult2 = await fence.complete.linkGoogleAcctMocked(users.user2);
    console.log(`linkResult2: ${JSON.stringify(linkResult2)}`);
      
    console.log(`creating temporary google creds for user2 with username:  ${users.user2.username}`);
    // call our endpoint to get temporary creds
    // NOTE: If this fails and you don't know why, it *might* be that we've hit our limit
    //       for SA keys on this user's Google Service Account. They *should* be cleaned
    //       up after every test but if they aren't, you need to delete the keys from the
    //       fence database (in table google_service_account_keys) AND delete them from
    //       the Google Cloud Platform. Check usersUtil.js for information about these users
    //       (specifically their username is their Google Account email, you can use that
    //        to find their service account in the GCP)
    const tempCreds2Res = await fence.complete.createTempGoogleCreds(
      users.user2.accessTokenHeader,
    );
    console.log(`tempCreds2Res: ${JSON.stringify(tempCreds2Res)}`);

    console.log('Use User2 to create signed URL for file in QA');
    const User2signedUrlQA1Res = await fence.do.createSignedUrlForUser(
      indexed_files.qaFile.did, users.user2.accessTokenHeader,
    );
    console.log(`User2signedUrlQA1Res: ${User2signedUrlQA1Res}`);

    console.log('Use User2 to create signed URL for file in test');
    const User2signedUrlTest1Res = await fence.do.createSignedUrlForUser(
      indexed_files.testFile.did, users.user2.accessTokenHeader,
    );

    console.log('saving temporary google creds to file');
    const creds2Key = tempCreds2Res.data.private_key_id;
    const pathToCreds2KeyFile = `${creds2Key}.json`;

    await files.createTmpFile(pathToCreds2KeyFile, JSON.stringify(tempCreds2Res.data));
    console.log(`Google creds file ${pathToCreds2KeyFile} saved!`);

    console.log('using saved google creds to access google bucket!! Save responses to check later');
    // use Google's client libraries to attempt to read a controlled access file with the
    // creds we just saved (based on the user's permissions)
    // attempt to access a file in the bucket
    user2AccessQA1Res = await google.getFileFromBucket(
      fence.props.googleBucketInfo.QA.googleProjectId,
      pathToCreds2KeyFile,
      fence.props.googleBucketInfo.QA.bucketId,
      fence.props.googleBucketInfo.QA.fileName,
      { nAttempts: 5, expectAccessDenied: true },
    );
    user2AccessTest1Res = await google.getFileFromBucket(
      fence.props.googleBucketInfo.test.googleProjectId,
      pathToCreds2KeyFile,
      fence.props.googleBucketInfo.test.bucketId,
      fence.props.googleBucketInfo.test.fileName,
      { nAttempts: 5, expectAccessDenied: true },
    );

    // Applying a new user.yaml to revoke QA access from users 0 and 1 and grant it to user2
    console.log(`Running useryaml job with ${Commons.userAccessFiles.newUserAccessFile2}`);
    Commons.setUserYaml(Commons.userAccessFiles.newUserAccessFile2);
    bash.runJob('useryaml');
    await checkPod('useryaml', 'gen3job,job-name=useryaml');

    // Maybe we need to wait a bit for Fence to talk to Google
    // and make sure the user's access has been revoked
    await sleepMS(20000)

    // get new access tokens b/c of changed access
    newUser2AccessToken = getAccessToken(users.user2.username, 3600);

    console.log('using saved google creds to access google bucket!! Save responses to check later');
    // use Google's client libraries to attempt to read a controlled access file with the
    // creds we just saved (based on the user's permissions)
    // attempt to access a file in the bucket
    user2AccessQA2Res = await google.getFileFromBucket(
      fence.props.googleBucketInfo.QA.googleProjectId,
      pathToCreds2KeyFile,
      fence.props.googleBucketInfo.QA.bucketId,
      fence.props.googleBucketInfo.QA.fileName,
    );
    user2AccessTest2Res = await google.getFileFromBucket(
      fence.props.googleBucketInfo.test.googleProjectId,
      pathToCreds2KeyFile,
      fence.props.googleBucketInfo.test.bucketId,
      fence.props.googleBucketInfo.test.fileName,
      { nAttempts: 5, expectAccessDenied: true },
    );

    console.log(`${new Date()}: user2AccessQA2Res: ${JSON.stringify(user2AccessQA2Res)}`);

    console.log('Use User2 to create signed URL for file in QA');
    const User2signedUrlQA2Res = await fence.do.createSignedUrlForUser(
      indexed_files.qaFile.did, getAccessTokenHeader(newUser2AccessToken),
    );
    const User2signedUrlQA2ResFileContents = await I.sendGetRequest(
      User2signedUrlQA2Res.data.url,
    ).then((res) => new Gen3Response(res));

    console.log('Use User2 to create signed URL for file in test');
    const User2signedUrlTest2Res = await fence.do.createSignedUrlForUser(
      indexed_files.testFile.did, getAccessTokenHeader(newUser2AccessToken),
    );

    console.log('deleting temporary google credentials');
    // call our endpoint to delete temporary creds
    const deleteCreds2Res = await fence.do.deleteTempGoogleCreds(
      creds2Key, users.user2.accessTokenHeader,
    );

    console.log('test cleanup: deleting google service accounts from google');
    const deleteServiceAccount2Res = await google.deleteServiceAccount(
      tempCreds2Res.data.client_email, tempCreds2Res.data.project_id,
    );

    console.log('deleting temporary google credentials file');
    if (files.fileExists(pathToCreds2KeyFile)) {
      files.deleteFile(pathToCreds2KeyFile);
      console.log(`${pathToCreds2KeyFile} deleted!`);
    }
    // FIRST RUN
    //  - Check Temporary Service Account Creds
    console.log('Make assertions for user access for first run');
    console.log('First: Check temporary service account credentials');

    chai.expect(user2AccessQA1Res,
      'First sync: Check User2 access CAN NOT bucket for project: QA. FAILED.').to.have.property('status', 403);
    chai.expect(user2AccessTest1Res,
      'First sync: Check User2 access CAN NOT bucket for project: test. FAILED.').to.have.property('status', 403);

    // FIRST RUN
    //  - Check Signed URLs
    console.log('Second: Check signed URLs');

    chai.expect(User2signedUrlQA1Res,
      'First sync: Check that User2 could NOT get a signed URL to read file in QA. FAILED.').to.have.property('status', 401);

    chai.expect(User2signedUrlTest1Res,
      'First sync: Check that User2 could NOT get a signed URL to read file in test. FAILED.').to.have.property('status', 401);

    // SECOND RUN (new authZ)
    //  - Check Temporary Service Account Creds
    console.log('Make assertions for user access for second run (after new usersync)');
    console.log('First: Check temporary service account credentials');

    chai.expect(user2AccessQA2Res,
      '2nd sync: Check User2 access bucket for project: QA. FAILED.').to.have.property('id');
    chai.expect(user2AccessTest2Res,
      '2nd sync: Check User2 access CAN NOT bucket for project: test. FAILED.').to.have.property('status', 403);

    // SECOND RUN (new authZ)
    //  - Check Signed URLs from SECOND RUN
    console.log('Second: Check signed URLs');

    chai.expect(User2signedUrlQA2ResFileContents.data,
      '2nd sync: Check User2 can use signed URL to read file in QA. FAILED.').to.equal(fence.props.googleBucketInfo.QA.fileContents);

    chai.expect(User2signedUrlTest2Res,
      '2nd sync: Check that User2 could NOT get a signed URL to read file in test. FAILED.').to.have.property('status', 401);

    // CLEANUP
    console.log('Finally: Ensure cleanup as successful');

    chai.expect(deleteCreds2Res,
      'Cleanup of temporary Google creds for User 2 FAILED.').to.have.property('status', 204);

    chai.expect(deleteServiceAccount2Res,
      'Cleanup of Google service account for User 2 FAILED.').to.be.empty;
  }
);
