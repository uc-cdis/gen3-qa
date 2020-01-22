/*eslint-disable */
Feature('GoogleDataAccess').retry(5);
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


NOTE: This is a giant test that asserts a lot of things. Why not multiple tests?
      Because usersync and useryaml jobs take a very long time. If we had to run
      them in b/t every test, this suite would take ten-fold or more time than
      it currently does.

      To compensate for the potential annoyance of "what actually failed?!" when this
      fails, we've added a ton of console.logs along the way so you know where the test
      got to. All assertions should also provide detailed information about failures.
*/
const chai = require('chai');
const { Commons } = require('../../utils/commons.js');
const fenceProps = require('../../services/apis/fence/fenceProps.js');
const { Bash } = require('../../utils/bash.js');
const apiUtil = require('../../utils/apiUtil.js');

const bash = new Bash();

const fs = require('fs');
const stringify = require('json-stringify-safe');

const I = actor();

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

async function deleteSAKeys(google, fence, users) {
  console.log('deleting keys for SA associated with users 0, 1 and user2...');
  ['user0', 'user1', 'user2'].forEach(async(user) => {
    const getCredsRes = await fence.do.getUserGoogleCreds(users[user].accessTokenHeader);
    console.log(`Keys from ${user}: ${JSON.stringify(getCredsRes.access_keys)}`);
    if (getCredsRes.access_keys.length > 0) {
      let saName = getCredsRes.access_keys[0].name.split('/')[3];
      console.log(`delete any existing keys for service account ${saName}`);
      const dcfSaKeys = await google.listServiceAccountKeys('dcf-integration', saName);
      console.log(`#### ##:' ${JSON.stringify(dcfSaKeys.keys)}`);
      if (dcfSaKeys.keys) {
        dcfSaKeys.keys.forEach(async (key) => {
          console.log(`the following key will be deleted: ${key.name}`);
          await google.deleteServiceAccountKey(key.name).then((deletionResult) => {
            console.log(`deletionResult: ${JSON.stringify(deletionResult)}`);
            if (deletionResult instanceof Error) {
              console.log(`WARN: Failed to delete key [${key.name}] from Google service account [${saName}].`);
	      } else {
                console.log(`INFO: Successfully deleted key [${key.name}] from Google service account [${saName}].`);
	      }
          });
        })
      };
    }
  });
}

BeforeSuite(async (google, fence, users, indexd, I) => {
  // making this data accessible in all scenarios through the actor's memory (the "I" object)
  I.cache = {};

  await deleteSAKeys(google, fence, users);

  console.log('Adding indexd files used to test signed urls');
  const ok = await indexd.do.addFileIndices(Object.values(indexed_files));
  chai.expect(ok).to.be.true;
});

AfterSuite(async (fence, indexd, users) => {
  const unlinkResults = Object.values(users).map((user) => fence.do.unlinkGoogleAcct(user));
  await Promise.all(unlinkResults);
  console.log('Running usersync job');
  bash.runJob('usersync', args = 'FORCE true');
  console.log('Removing indexd files used to test signed urls');
  await indexd.do.deleteFileIndices(Object.values(indexed_files));
});

// FIRST RUN
//  - Check Temporary Service Account Creds
Scenario('Test Google Data Access (temp creds) @reqGoogle @googleDataAccess',
  async (fence, indexd, users, google, files, I) => {
    console.log(`creating temporary google creds for users with usernames:  ${users.user0.username}, ${users.user1.username}, ${users.user2.username}`);
    // call our endpoint to get temporary creds
    // NOTE: If this fails and you don't know why, it *might* be that we've hit our limit
    //	      for SA keys on this user's Google Service Account. They *should* be cleaned
    //	      up after every test but if they aren't, you need to delete the keys from the
    //	      fence database (in table google_service_account_keys) AND delete them from
    //	      the Google Cloud Platform. Check usersUtil.js for information about these users
    //	      (specifically their username is their Google Account email, you can use that
    //	       to find their service account in the GCP)
    const tempCreds0Res = await fence.complete.createTempGoogleCreds(
      users.user0.accessTokenHeader,
    );
    const tempCreds1Res = await fence.complete.createTempGoogleCreds(
      users.user1.accessTokenHeader,
    );
    const tempCreds2Res = await fence.complete.createTempGoogleCreds(
      users.user2.accessTokenHeader,
    );
    // This info is needed in the 2nd run with the new authZ
    I.cache.tempCreds0Res = tempCreds0Res;
    I.cache.tempCreds1Res = tempCreds1Res;
    I.cache.tempCreds2Res = tempCreds2Res;
    
    await apiUtil.sleepMS(1 * 1000);

    console.log('saving temporary google creds to file');
    const creds0Key = tempCreds0Res.data.private_key_id;
    const creds1Key = tempCreds1Res.data.private_key_id;
    const creds2Key = tempCreds2Res.data.private_key_id;
    const pathToCreds0KeyFile = `${creds0Key}.json`;
    const pathToCreds1KeyFile = `${creds1Key}.json`;
    const pathToCreds2KeyFile = `${creds2Key}.json`;
    
    await files.createTmpFile(pathToCreds0KeyFile, JSON.stringify(tempCreds0Res.data));
    console.log(`Google creds file ${pathToCreds0KeyFile} saved!`);
    
    await files.createTmpFile(pathToCreds1KeyFile, JSON.stringify(tempCreds1Res.data));
    console.log(`Google creds file ${pathToCreds1KeyFile} saved!`);
    
    await files.createTmpFile(pathToCreds2KeyFile, JSON.stringify(tempCreds2Res.data));
    console.log(`Google creds file ${pathToCreds2KeyFile} saved!`);
    
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
    );
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
    user2AccessQA1Res = await google.getFileFromBucket(
      fence.props.googleBucketInfo.QA.googleProjectId,
      pathToCreds2KeyFile,
      fence.props.googleBucketInfo.QA.bucketId,
      fence.props.googleBucketInfo.QA.fileName,
   );
   user2AccessTest1Res = await google.getFileFromBucket(
      fence.props.googleBucketInfo.test.googleProjectId,
      pathToCreds2KeyFile,
      fence.props.googleBucketInfo.test.bucketId,
      fence.props.googleBucketInfo.test.fileName,
    );

    console.log('Make assertions for user access for first run');
    console.log('First: Check temporary service account credentials');

    chai.expect(user0AccessQA1Res,
      'First sync: Check User0 access bucket for project: QA. FAILED.').to.have.property('id');
    chai.expect(user0AccessTest1Res,
      'First sync: Check User0 CAN NOT access bucket for project: test. FAILED.').to.have.property('status', 403);

    chai.expect(user1AccessQA1Res,
      'First sync: Check User1 access bucket for project: QA. FAILED.').to.have.property('id');
    chai.expect(user1AccessTest1Res,
      'First sync: Check User1 access bucket for project: test. FAILED.').to.have.property('id');

    chai.expect(user2AccessQA1Res,
      'First sync: Check User2 access CAN NOT bucket for project: QA. FAILED.').to.have.property('status', 403);
    chai.expect(user2AccessTest1Res,
      'First sync: Check User2 access CAN NOT bucket for project: test. FAILED.').to.have.property('status', 403);
  }
).retry(2);

// FIRST RUN
//  - Check Signed URLs
Scenario('Test Google Data Access (signed urls) @reqGoogle @googleDataAccess',
  async (fence, indexd, users, google, files, I) => {
    console.log(`Double-check if file ${indexed_files.qaFile.did} is indexed. If it isn't fail fast.`);
    const indexdLookupRes = await indexd.do.getFile(indexed_files.qaFile, users.user0.accessTokenHeader);
    chai.expect(indexdLookupRes,
      `First sync: Check if the [indexed_files.qaFile] (${indexed_files.qaFile.filename}) has been indexed. Otherwise fail fast.`).to.have.property('file_name', indexed_files.qaFile.filename);

      console.log('make sure users google accounts are unlinked');
      await fence.complete.forceUnlinkGoogleAcct(users.user0);
      await fence.complete.forceUnlinkGoogleAcct(users.user1);
      await fence.complete.forceUnlinkGoogleAcct(users.user2);
      await apiUtil.sleepMS(1 * 1000);

      console.log('linking users google accounts');
      await fence.complete.linkGoogleAcctMocked(users.user0);
      await fence.complete.linkGoogleAcctMocked(users.user1);
      await fence.complete.linkGoogleAcctMocked(users.user2);
      await apiUtil.sleepMS(2 * 1000);

      console.log('Use User0 to create signed URL for file in QA');
      const User0signedUrlQA1Res = await fence.do.createSignedUrlForUser(
        indexed_files.qaFile.did, users.user0.accessTokenHeader,
      );
      // This info is needed in the 2nd run with the new authZ
      I.cache.User0signedUrlQA1Res = User0signedUrlQA1Res;
      await apiUtil.sleepMS(1 * 1000);
      const User0signedUrlQA1FileContents = await fence.do.getFileFromSignedUrlRes(
        User0signedUrlQA1Res,
      );
      console.log(`User0signedUrlQA1FileContents: ${stringify(User0signedUrlQA1FileContents).substring(User0signedUrlQA1FileContents.length-100, User0signedUrlQA1FileContents.length)}`);

      console.log('Use User1 to create signed URL for file in QA');
      const User1signedUrlQA1Res = await fence.do.createSignedUrlForUser(
        indexed_files.qaFile.did, users.user1.accessTokenHeader,
      );
      // This info is needed in the 2nd run with the new authZ
      I.cache.User1signedUrlQA1Res = User1signedUrlQA1Res;
      await apiUtil.sleepMS(1 * 1000);
      const User1signedUrlQA1ResFileContents = await fence.do.getFileFromSignedUrlRes(
        User1signedUrlQA1Res,
      );
      console.log(`User1signedUrlQA1ResFileContents: ${stringify(User1signedUrlQA1ResFileContents).substring(User1signedUrlQA1ResFileContents.length-100, User1signedUrlQA1ResFileContents.length)}`);

      console.log('Use User2 to create signed URL for file in QA');
      const User2signedUrlQA1Res = await fence.do.createSignedUrlForUser(
        indexed_files.qaFile.did, users.user2.accessTokenHeader,
      );
      // This info is needed in the 2nd run with the new authZ
      I.cache.User2signedUrlQA1Res = User2signedUrlQA1Res;
      await apiUtil.sleepMS(1 * 1000);

      console.log('Use User0 to create signed URL for file in test');
      const User0signedUrlTest1Res = await fence.do.createSignedUrlForUser(
        indexed_files.testFile.did, users.user0.accessTokenHeader,
      );
      await apiUtil.sleepMS(1 * 1000);

      console.log('Use User1 to create signed URL for file in test');
      const User1signedUrlTest1Res = await fence.do.createSignedUrlForUser(
        indexed_files.testFile.did, users.user1.accessTokenHeader,
      );
      // This info is needed in the 2nd run with the new authZ
      I.cache.User1signedUrlTest1Res = User1signedUrlTest1Res;
      await apiUtil.sleepMS(1 * 1000);
      const User1signedUrlTest1ResFileContents = await fence.do.getFileFromSignedUrlRes(
        User1signedUrlTest1Res,
      );

      console.log('Use User2 to create signed URL for file in test');
      const User2signedUrlTest1Res = await fence.do.createSignedUrlForUser(
        indexed_files.testFile.did, users.user2.accessTokenHeader,
      );
      await apiUtil.sleepMS(1 * 1000);

      console.log('Second: Check signed URLs');
      chai.expect(User0signedUrlQA1FileContents,
        'First sync: Check User0 can use signed URL to read file in QA. FAILED.').to.equal(fence.props.googleBucketInfo.QA.fileContents);
   
      chai.expect(User1signedUrlQA1ResFileContents,
        'First sync: Check User1 can use signed URL to read file in QA. FAILED.').to.equal(fence.props.googleBucketInfo.QA.fileContents);
   
      chai.expect(User2signedUrlQA1Res,
        'First sync: Check that User2 could NOT get a signed URL to read file in QA. FAILED.').to.have.property('status', 401);
   
      chai.expect(User0signedUrlTest1Res,
        'First sync: Check that User0 could NOT get a signed URL to read file in test. FAILED.').to.have.property('status', 401);
   
      chai.expect(User1signedUrlTest1ResFileContents,
        'First sync: Check User1 can use signed URL to read file in test. FAILED.').to.equal(fence.props.googleBucketInfo.test.fileContents);
   
      chai.expect(User2signedUrlTest1Res,
        'First sync: Check that User2 could NOT get a signed URL to read file in test. FAILED.').to.have.property('status', 401);
  }
).retry(2);

// SECOND RUN (new authZ)
//  - Check Temporary Service Account Creds
// Depends on I.cache.tempCreds0Res defined in previous scenario
Scenario('New authZ: Test Google Data Access (temp creds) @reqGoogle @googleDataAccess',
  async (fence, indexd, users, google, files, I) => {
    console.log(`Running useryaml job with ${Commons.userAccessFiles.newUserAccessFile2}`);
    Commons.setUserYaml(Commons.userAccessFiles.newUserAccessFile2);
    bash.runJob('useryaml');

    console.log('saving temporary google creds to file');
    const creds0Key = I.cache.tempCreds0Res.data.private_key_id;
    const creds1Key = I.cache.tempCreds1Res.data.private_key_id;
    const creds2Key = I.cache.tempCreds2Res.data.private_key_id;

    // This info is needed in the 2nd run with the new authZ
    I.cache.creds0Key = creds0Key;
    I.cache.creds1Key = creds1Key;
    I.cache.creds2Key = creds2Key;

    const pathToCreds0KeyFile = `${creds0Key}.json`;
    const pathToCreds1KeyFile = `${creds1Key}.json`;
    const pathToCreds2KeyFile = `${creds2Key}.json`;

    // This info is needed in the 2nd run with the new authZ
    I.cache.pathToCreds0KeyFile = pathToCreds0KeyFile;
    I.cache.pathToCreds1KeyFile = pathToCreds1KeyFile;
    I.cache.pathToCreds2KeyFile = pathToCreds2KeyFile;

    await files.createTmpFile(pathToCreds0KeyFile, JSON.stringify(I.cache.tempCreds0Res.data));
    console.log(`Google creds file ${pathToCreds0KeyFile} saved!`);
    
    await files.createTmpFile(pathToCreds1KeyFile, JSON.stringify(I.cache.tempCreds1Res.data));
    console.log(`Google creds file ${pathToCreds1KeyFile} saved!`);
    
    await files.createTmpFile(pathToCreds2KeyFile, JSON.stringify(I.cache.tempCreds2Res.data));
    console.log(`Google creds file ${pathToCreds2KeyFile} saved!`);
      
    console.log('using saved google creds to access google bucket!! Save responses to check later');
    // use Google's client libraries to attempt to read a controlled access file with the
    // creds we just saved (based on the user's permissions)
    // attempt to access a file in the bucket
    user0AccessQA2Res = await google.getFileFromBucket(
      fence.props.googleBucketInfo.QA.googleProjectId,
      pathToCreds0KeyFile,
      fence.props.googleBucketInfo.QA.bucketId,
      fence.props.googleBucketInfo.QA.fileName,
    );
    user0AccessTest2Res = await google.getFileFromBucket(
      fence.props.googleBucketInfo.test.googleProjectId,
      pathToCreds0KeyFile,
      fence.props.googleBucketInfo.test.bucketId,
      fence.props.googleBucketInfo.test.fileName,
    );
    user1AccessQA2Res = await google.getFileFromBucket(
      fence.props.googleBucketInfo.QA.googleProjectId,
      pathToCreds1KeyFile,
      fence.props.googleBucketInfo.QA.bucketId,
      fence.props.googleBucketInfo.QA.fileName,
    );
    user1AccessTest2Res = await google.getFileFromBucket(
      fence.props.googleBucketInfo.test.googleProjectId,
      pathToCreds1KeyFile,
      fence.props.googleBucketInfo.test.bucketId,
      fence.props.googleBucketInfo.test.fileName,
    );
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
    );

    console.log('Make assertions for user access for second run (after new usersync)');
    console.log('First: Check temporary service account credentials');

    chai.expect(user0AccessQA2Res,
      '2nd sync: Check User0 CAN NOT access bucket for project: QA. FAILED.').to.have.property('status', 403);
    chai.expect(user0AccessTest2Res,
      '2nd sync: Check User0 CAN NOT access bucket for project: test. FAILED.').to.have.property('status', 403);

    chai.expect(user1AccessQA2Res,
      '2nd sync: Check User1 CAN NOT access bucket for project: QA. FAILED.').to.have.property('status', 403);
    chai.expect(user1AccessTest2Res,
      '2nd sync: Check User1 access bucket for project: test. FAILED.').to.have.property('id');

    chai.expect(user2AccessQA2Res,
      '2nd sync: Check User2 access bucket for project: QA. FAILED.').to.have.property('id');
    chai.expect(user2AccessTest2Res,
      '2nd sync: Check User2 access CAN NOT bucket for project: test. FAILED.').to.have.property('status', 403);
  }
).retry(2);

// SECOND RUN (new authZ)
//  - Check Signed URLs from SECOND RUN
Scenario('New authZ: Test Google Data Access (signed urls) @reqGoogle @googleDataAccess',
  async (fence, indexd, users, google, files, I) => {
    console.log(`Running useryaml job with ${Commons.userAccessFiles.newUserAccessFile2}`);
    Commons.setUserYaml(Commons.userAccessFiles.newUserAccessFile2);
    bash.runJob('useryaml');

    // get new access tokens b/c of changed access
    const newUser0AccessToken = apiUtil.getAccessToken(users.user0.username, 3600);
    const newUser1AccessToken = apiUtil.getAccessToken(users.user1.username, 3600);
    const newUser2AccessToken = apiUtil.getAccessToken(users.user2.username, 3600);

    console.log('Use User0 to create signed URL for file in QA');
    const User0signedUrlQA2Res = await fence.do.createSignedUrlForUser(
      indexed_files.qaFile.did, apiUtil.getAccessTokenHeader(newUser0AccessToken),
    );
    await apiUtil.sleepMS(1 * 1000);
    console.log('Use User1 to create signed URL for file in QA');
    const User1signedUrlQA2Res = await fence.do.createSignedUrlForUser(
      indexed_files.qaFile.did, apiUtil.getAccessTokenHeader(newUser1AccessToken),
    );
    await apiUtil.sleepMS(1 * 1000);
    console.log('Use User2 to create signed URL for file in QA');
    const User2signedUrlQA2Res = await fence.do.createSignedUrlForUser(
      indexed_files.qaFile.did, apiUtil.getAccessTokenHeader(newUser2AccessToken),
    );
    await apiUtil.sleepMS(1 * 1000);
    const User2signedUrlQA2ResFileContents = await fence.do.getFileFromSignedUrlRes(
      User2signedUrlQA2Res,
    );
    console.log(`User2signedUrlQA2ResFileContents: ${stringify(User2signedUrlQA2ResFileContents).substring(User2signedUrlQA2ResFileContents.length-100, User2signedUrlQA2ResFileContents.length)}`);

    console.log('Use User0 to create signed URL for file in test');
    const User0signedUrlTest2Res = await fence.do.createSignedUrlForUser(
      indexed_files.testFile.did, apiUtil.getAccessTokenHeader(newUser0AccessToken),
    );
    await apiUtil.sleepMS(1 * 1000);
    console.log('Use User1 to create signed URL for file in test');
    const User1signedUrlTest2Res = await fence.do.createSignedUrlForUser(
      indexed_files.testFile.did, apiUtil.getAccessTokenHeader(newUser1AccessToken),
    );
    await apiUtil.sleepMS(1 * 1000);
    const User1signedUrlTest2ResFileContents = await fence.do.getFileFromSignedUrlRes(
      User1signedUrlTest2Res,
    ).catch((err) => err && err.response && err.response.data || err);
    console.log(`User1signedUrlTest2ResFileContents: ${stringify(User1signedUrlTest2ResFileContents).substring(User1signedUrlTest2ResFileContents.length-100, User1signedUrlTest2ResFileContents.length)}`);

    console.log('Use User2 to create signed URL for file in test');
    const User2signedUrlTest2Res = await fence.do.createSignedUrlForUser(
      indexed_files.testFile.did, apiUtil.getAccessTokenHeader(newUser2AccessToken),
    );
    await apiUtil.sleepMS(1 * 1000);

    console.log('Second: Check signed URLs');
    chai.expect(User1signedUrlQA2Res,
      '2nd sync: Check that User1 could NOT get a signed URL to read file in QA. FAILED.').to.have.property('status', 401);

    chai.expect(User0signedUrlQA2Res,
      '2nd sync: Check that User0 could NOT get a signed URL to read file in QA. FAILED.').to.have.property('status', 401);

    chai.expect(User2signedUrlQA2ResFileContents,
      '2nd sync: Check User2 can use signed URL to read file in QA. FAILED.').to.equal(fence.props.googleBucketInfo.QA.fileContents);

    chai.expect(User0signedUrlTest2Res,
      '2nd sync: Check that User0 could NOT get a signed URL to read file in test. FAILED.').to.have.property('status', 401);

    chai.expect(User1signedUrlTest2ResFileContents,
      '2nd sync: Check User1 can use signed URL to read file in test. FAILED.').to.equal(fence.props.googleBucketInfo.test.fileContents);

    chai.expect(User2signedUrlTest2Res,
      '2nd sync: Check that User2 could NOT get a signed URL to read file in test. FAILED.').to.have.property('status', 401);
  }
).retry(2);

// SECOND RUN
//  - Check signed URLs from FIRST RUN
// This scenario cannot be executed independently as it depends on information from the previous scenarios
// All the info is shared through the I.cache object
// TODO: Discuss a better approach to run this scenario independently
Scenario('Test Google Data Access again (signed urls) @reqGoogle @googleDataAccess',
  async (fence, indexd, users, google, files, I) => {
    // Assuming new AuthZ is in place
    // use old signed urls to try and access data again
    console.log('Use signed URL from User0 to try and access QA data again');
    const User0AccessRemovedQA = await fence.do.getFileFromSignedUrlRes(
      I.cache.User0signedUrlQA1Res,
    ).catch((err) => err && err.response && err.response.data || err);

    console.log('Use signed URL from User1 to try and access QA data again');
    const User1AccessRemovedQA = await fence.do.getFileFromSignedUrlRes(
      I.cache.User1signedUrlQA1Res,
    ).catch((err) => err && err.response && err.response.data || err);

    console.log('Use signed URL from User1 to try and access test data again');
    const User1AccessRemainsTest = await fence.do.getFileFromSignedUrlRes(
      I.cache.User1signedUrlTest1Res,
    ).catch((err) => err && err.response && err.response.data || err);

    console.log('deleting temporary google credentials');
    // call our endpoint to delete temporary creds
    const deleteCreds0Res = await fence.do.deleteTempGoogleCreds(
      I.cache.creds0Key, users.user0.accessTokenHeader,
    );
    const deleteCreds1Res = await fence.do.deleteTempGoogleCreds(
      I.cache.creds1Key, users.user1.accessTokenHeader,
    );
    const deleteCreds2Res = await fence.do.deleteTempGoogleCreds(
      I.cache.creds2Key, users.user2.accessTokenHeader,
    );

    console.log('test cleanup: deleting google service accounts from google');
    const deleteServiceAccount0Res = await google.deleteServiceAccount(
      I.cache.tempCreds0Res.data.client_email, I.cache.tempCreds0Res.data.project_id,
    );
    const deleteServiceAccount1Res = await google.deleteServiceAccount(
      I.cache.tempCreds1Res.data.client_email, I.cache.tempCreds1Res.data.project_id,
    );
    const deleteServiceAccount2Res = await google.deleteServiceAccount(
      I.cache.tempCreds2Res.data.client_email, I.cache.tempCreds2Res.data.project_id,
    );

    console.log('deleting temporary google credentials file');
    if (files.fileExists(I.cache.pathToCreds0KeyFile)) {
      files.deleteFile(I.cache.pathToCreds0KeyFile);
      console.log(`${I.cache.pathToCreds0KeyFile} deleted!`);
    }
    if (files.fileExists(I.cache.pathToCreds1KeyFile)) {
      files.deleteFile(I.cache.pathToCreds1KeyFile);
      console.log(`${I.cache.pathToCreds1KeyFile} deleted!`);
    }
    if (files.fileExists(I.cache.pathToCreds2KeyFile)) {
      files.deleteFile(I.cache.pathToCreds2KeyFile);
      console.log(`${I.cache.pathToCreds2KeyFile} deleted!`);
    }

    chai.expect(User0AccessRemovedQA,
      'Make sure signed URL from User0 CANNOT access QA data again. FAILED.').not.equal(fence.props.googleBucketInfo.QA.fileContents);

    chai.expect(User1AccessRemovedQA,
      'Make sure signed URL from User1 CANNOT access QA data again. FAILED.').not.equal(fence.props.googleBucketInfo.QA.fileContents);

    chai.expect(User1AccessRemainsTest,
      'Make sure signed URL from User1 CAN access test data again. FAILED.').to.equal(fence.props.googleBucketInfo.test.fileContents);

    // CLEANUP
    console.log('Finally: Ensure cleanup as successful');

    chai.expect(deleteCreds0Res,
      'Cleanup of temporary Google creds for User 0 FAILED.').to.have.property('status', 204);
    chai.expect(deleteCreds1Res,
      'Cleanup of temporary Google creds for User 1 FAILED.').to.have.property('status', 204);
    chai.expect(deleteCreds2Res,
      'Cleanup of temporary Google creds for User 2 FAILED.').to.have.property('status', 204);

    chai.expect(deleteServiceAccount0Res,
      'Cleanup of Google service account for User 0 FAILED.').to.be.empty;
    chai.expect(deleteServiceAccount1Res,
      'Cleanup of Google service account for User 1 FAILED.').to.be.empty;
    chai.expect(deleteServiceAccount2Res,
      'Cleanup of Google service account for User 2 FAILED.').to.be.empty;
  }
).retry(2);
