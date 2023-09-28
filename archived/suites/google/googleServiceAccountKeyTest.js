/*eslint-disable */
const chai = require('chai');
const apiUtil = require('../../../utils/apiUtil.js');
const { Bash } = require('../../../utils/bash.js');

const bash = new Bash();

Feature('GoogleServiceAccountKey');

/**
 * Calculate the age of a given service account key based on its 'validAfterTime' parameter
 * @param {int} number of days since the creation of the key
 */
function calculateSAKeyAge(creationDate) {
  const date1 = new Date(creationDate);
  const date2 = new Date(); // current date
  const differenceInTime = date2.getTime() - date1.getTime();
  return differenceInTime / (1000 * 3600 * 24); // Difference_In_Days
}

BeforeSuite(async ({ google, fence, users }) => {
  console.log('cleaning up old keys from the user0 service account in the dcf-integration GCP project');
  const getCredsRes = await fence.do.getUserGoogleCreds(users.user0.accessTokenHeader);
  await google.deleteSAKeys(users.user0.username, getCredsRes.access_keys);

  await fence.complete.suiteCleanup(google, users);
});


After(async ({ google, fence, users }) => {
  await fence.complete.suiteCleanup(google, users);
});

Scenario('Get current SA creds @reqGoogle', async ({ fence, users }) => {
  const EXPIRES_IN = 5;

  // Make sure there are no creds for this user
  let getCredsRes = await fence.do.getUserGoogleCreds(users.user0.accessTokenHeader);

  const credsList1 = getCredsRes.access_keys;
  console.log(`credsList1 - This is supposed to return zero keys: ${JSON.stringify(credsList1)}`);
  chai.expect(credsList1.length, `There should not be existing SA keys at the beginning of the test, but this key lingers: ${JSON.stringify(credsList1)}`).to.equal(0);

  // Get temporary google creds
  let tempCredsRes = await fence.complete.createTempGoogleCreds(users.user0.accessTokenHeader);
  const keyId1 = tempCredsRes.data.private_key_id;
  console.log(`Generated key ${keyId1}`);

  // Get temporary google creds with custom expiration
  tempCredsRes = await fence.complete.createTempGoogleCreds(
    users.user0.accessTokenHeader,
    EXPIRES_IN,
  );
  const keyId2 = tempCredsRes.data.private_key_id;
  console.log(`Generated key ${keyId2}`);

  // Get list of current creds
  getCredsRes = await fence.do.getUserGoogleCreds(users.user0.accessTokenHeader);
  const credsList2 = getCredsRes.access_keys;
  console.log('Current SA creds:');
  console.log(credsList2);

  // Delete a key
  await fence.do.deleteTempGoogleCreds(
    keyId1,
    users.user0.accessTokenHeader,
  );

  // Get list of current creds
  getCredsRes = await fence.do.getUserGoogleCreds(users.user0.accessTokenHeader);
  const credsList3 = getCredsRes.access_keys;

  // Clean up
  console.log('cleaning up');

  await fence.do.deleteTempGoogleCreds(
    keyId2,
    users.user0.accessTokenHeader,
  );

  // Asserts
  chai.expect(
    credsList2.length,
    'The 2 generated SA keys should be listed',
  ).to.equal(2);

  const key1 = credsList2.filter(( key ) => key.name.includes(keyId1));
  chai.expect(
    key1.length,
    'The generated SA key should be listed',
  ).to.equal(1);

  let start = Date.parse(key1[0].validAfterTime);
  let end = Date.parse(key1[0].validBeforeTime);
  chai.expect(
    (end - start) / 10000,
    `The key should be set to expire in ${fence.props.linkExtendDefaultAmount} secs`,
  ).to.be.within(
    fence.props.linkExtendDefaultAmount - 5,
    fence.props.linkExtendDefaultAmount + 5,
  );

  let key2 = credsList2.filter(( key ) => key.name.includes(keyId2));
  chai.expect(
    key2.length,
    'The generated SA key should be listed',
  ).to.equal(1);

  start = Date.parse(key2[0].validAfterTime);
  end = Date.parse(key2[0].validBeforeTime);
  chai.expect(
    (end - start) / 10000,
    `The key should be set to expire in ${EXPIRES_IN} secs`,
  ).to.be.within(EXPIRES_IN - 5, EXPIRES_IN + 5);

  chai.expect(
    credsList3.length,
    'Only 1 SA key should be listed after the other one is deleted',
  ).to.equal(1);

  key2 = credsList3.filter(( key ) => key.name.includes(keyId2));
  chai.expect(
    key2.length,
    'Only the SA key that was not deleted should be listed',
  ).to.equal(1);
}).retry(2);


Scenario('Test no data access anymore after SA key is deleted @reqGoogle', async ({ fence, users, google, files }) => {
  // Get temporary Service Account creds, get object in bucket, delete creds

  // But first, make sure there are no lingering keys (fail-fast)
  let checkGetCredsRes = await fence.do.getUserGoogleCreds(users.user0.accessTokenHeader);
  const checkCredsList1 = checkGetCredsRes.access_keys;
  console.log(`checkCredsList1 - This is supposed to return zero keys: ${JSON.stringify(checkCredsList1)}`);
  chai.expect(checkCredsList1.length, `This test creates and deletes keys so it assumes zero keys at the beginning, this key was supposed to be deleted: ${JSON.stringify(checkCredsList1)}`).to.equal(0);

  // Get creds to access data
  const tempCreds0Res = await fence.complete.createTempGoogleCreds(users.user0.accessTokenHeader);
  if (process.env.DEBUG === 'true') {
    console.log(`tempCreds0Res: ${JSON.stringify(tempCreds0Res)}`);
  }
  const creds0Key = tempCreds0Res.data.private_key_id;
  const pathToCreds0KeyFile = `${creds0Key}.json`;
  await files.createTmpFile(pathToCreds0KeyFile, JSON.stringify(tempCreds0Res.data));
  if (process.env.DEBUG === 'true') {
    console.log(`Google creds file ${pathToCreds0KeyFile} saved with contents ${tempCreds0Res.data}!`);
  }
  // Access data
  const user0AccessQARes = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToCreds0KeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName,
  );

  // Delete the key
  await fence.do.deleteTempGoogleCreds(
    creds0Key,
    users.user0.accessTokenHeader,
  );

  // Try to access data
  const user0AccessQAResExpired = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToCreds0KeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName,
  );

  // Clean up
  console.log('cleaning up');

  await fence.do.deleteTempGoogleCreds(
    creds0Key,
    users.user0.accessTokenHeader,
  );
  files.deleteFile(pathToCreds0KeyFile);

  // Asserts
  chai.expect(
    user0AccessQARes,
    'User should have bucket access',
  ).to.have.property('id');
  chai.expect(
    user0AccessQAResExpired,
    'User should NOT have bucket access after key deletion',
  ).to.have.property('status').that.is.oneOf([400, 403, '400', '403']);
}).retry(2);


Scenario('Delete SA creds that do not exist @reqGoogle', async ({ fence, users }) => {
  const fakeKeyId = '64a48da067f4a4f053e6197bf2b134df7d0abcde';  // pragma: allowlist secret
  const deleteRes = await fence.do.deleteTempGoogleCreds(
    fakeKeyId,
    users.user0.accessTokenHeader,
  );
  chai.expect(
    deleteRes,
    'Deleting a SA key that does not exist should return 404',
  ).has.property('status', 404);
}).retry(2);


Scenario('SA key removal job test: remove expired creds @reqGoogle', async ({ I, fence, users, google, files }) => {
  // Test that we do not have access to data anymore after the SA key is expired
  const EXPIRES_IN = 1;

  // Get creds to access data
  const tempCreds0Res = await fence.complete.createTempGoogleCreds(
    users.user0.accessTokenHeader,
    EXPIRES_IN,
  );
  if (process.env.DEBUG === 'true') {
    console.log(`tempCreds0Res: ${tempCreds0Res}`);
  }
  const creds0Key = tempCreds0Res.data.private_key_id;
  const pathToCreds0KeyFile = `${creds0Key}.json`;
  await files.createTmpFile(pathToCreds0KeyFile, JSON.stringify(tempCreds0Res.data));
  console.log(`Google creds file ${pathToCreds0KeyFile} saved!`);

  // Access data
  const user0AccessQARes = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToCreds0KeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName,
  );

  // Wait for the key to expire
  console.log('waiting for the key to expire');
  await apiUtil.sleepMS((EXPIRES_IN + 5) * 1000);

  // Run the expired SA key clean up job
  console.log('Clean up expired Service Account keys');
  bash.runJob('google-manage-keys');

  await apiUtil.checkPod(I, 'google-manage-keys', 'gen3job', { nAttempts: 20, ignoreFailure: false, keepSessionAlive: true });

  // Get list of current creds
  let getCredsRes = await fence.do.getUserGoogleCreds(users.user0.accessTokenHeader);
  console.log(`getCredRes - This is supposed to return zero keys: ${JSON.stringify(getCredsRes.access_keys)}`);
  credsList = getCredsRes.access_keys;

  // Try to access data
  const user0AccessQAResExpired = await google.getFileFromBucket(
    fence.props.googleBucketInfo.QA.googleProjectId,
    pathToCreds0KeyFile,
    fence.props.googleBucketInfo.QA.bucketId,
    fence.props.googleBucketInfo.QA.fileName,
  );

  // Clean up
  console.log('cleaning up');

  // should have been deleted by the google-manage-keys-job
  // send delete request just in case (do not check if it was actually deleted)
  await fence.do.deleteTempGoogleCreds(
    creds0Key,
    users.user0.accessTokenHeader,
  ).then((deletionResult) => {
    if (process.env.DEBUG === 'true') {
      console.log(`deletionResult: ${JSON.stringify(deletionResult)}`);
      console.log(`is it an error?: ${deletionResult instanceof Error}`);
    }
    if(deletionResult instanceof Error) {
      console.log(`Error during Google service account deletion: ${deletionResult}`);
    }
  });

  // sanity check
  // Get list of current creds
  getCredsRes = await fence.do.getUserGoogleCreds(users.user0.accessTokenHeader);
  console.log(`getCredRes - This is supposed to return zero keys: ${JSON.stringify(getCredsRes.access_keys)}`);
  credsList = getCredsRes.access_keys;

  files.deleteFile(pathToCreds0KeyFile);

  // Asserts
  chai.expect(
    user0AccessQARes,
    'User should have bucket access before expiration',
  ).to.have.property('id');
  chai.expect(
    user0AccessQAResExpired,
    'User should NOT have bucket access after expiration',
  ).to.have.property('status').that.is.oneOf(
    [400, 403, '400', '403'],
  );
});


Scenario('SA key removal job test: remove expired creds that do not exist in google @reqGoogle', async ({ I, fence, users, google }) => {
  // Test that the job removes keys from the fence DB even if some of them do not exist in google

  const EXPIRES_IN = 1;

  // Get creds to access data
  const tempCredsRes1 = await fence.complete.createTempGoogleCreds(
    users.user0.accessTokenHeader,
    EXPIRES_IN,
  );
  if (process.env.DEBUG === 'true') {
    console.log(`tempCredsRes1: ${tempCredsRes1.data.private_key_id}`);
  }
  const credsKey1 = tempCredsRes1.data.private_key_id;

  // Get other creds to access data, with short expiration time
  const tempCredsRes2 = await fence.complete.createTempGoogleCreds(
    users.user0.accessTokenHeader,
    EXPIRES_IN,
  );
  if (process.env.DEBUG === 'true') {
    console.log(`tempCredsRes2: ${tempCredsRes2.data.private_key_id}`);
  }
  const credsKey2 = tempCredsRes2.data.private_key_id;

  // Get the complete name of the generated key and delete it in google
  let getCredsRes = await fence.do.getUserGoogleCreds(users.user0.accessTokenHeader);
  let credsList = getCredsRes.access_keys;
  const key = credsList.filter(( aKey ) => aKey.name.includes(credsKey1))[0];
  await google.deleteServiceAccountKey(key.name).then((deletionResult) => {
    if (process.env.DEBUG === 'true') {
      console.log(`deletionResult: ${JSON.stringify(deletionResult)}`);
      console.log(`is it an error?: ${deletionResult instanceof Error}`);
    }
    if(deletionResult instanceof Error) {
      console.log(`Error during Google service account key deletion: ${deletionResult}`);
    }
  });

  // Wait for the keys to expire
  console.log('waiting for the key to expire');
  await apiUtil.sleepMS((EXPIRES_IN + 5) * 1000);

  // Run the expired SA key clean up job
  console.log('Clean up expired Service Account keys');
  await bash.runJob('google-manage-keys');

  await apiUtil.checkPod(I, 'google-manage-keys', 'gen3job', { nAttempts: 20, ignoreFailure: false, keepSessionAlive: true });

  const nAttempts = 6;
  for (let i = 1; i <= nAttempts; i += 1) {
    console.log(`Checking the number of keys associated with the service account... - attempt ${i}`);

    // Get list of current creds (again)
    getCredsRes = await fence.do.getUserGoogleCreds(users.user0.accessTokenHeader);
    if (process.env.DEBUG === 'true') {
      console.log(`getCredRes - This is supposed to return zero keys: ${JSON.stringify(getCredsRes.access_keys)}`);
    }
    credsList = getCredsRes.access_keys;

    if (credsList.length > 0) {
      console.log(`${new Date()} WARN: There is still one or more pesky keys in there... - attempt ${i}`);
      await apiUtil.sleepMS(10000);
      if (i === nAttempts) {
        const googleManageKeysLogs = await bash.runCommand('gen3 job logs google-manage-keys');
        if (process.env.DEBUG === 'true') {
          console.log(`googleManageKeysLogs: ${googleManageKeysLogs}`);
          console.log(`ERROR: Something went wrong with the deletion of expired keys. Proceed with the assertions and mark this test as failed.`);
        }
      }
    }

    // Run the expired SA key clean up job
    console.log('Clean up expired Service Account keys');
    await bash.runJob('google-manage-keys');

    await apiUtil.checkPod(I, 'google-manage-keys', 'gen3job', { nAttempts: 20, ignoreFailure: false, keepSessionAlive: true });
  }

  // Clean up
  console.log('cleaning up');

  /* UPDATE: Keep the crime scene around if google-manage-keys-job fails 
  // should have been deleted by the google-manage-keys-job
  // send delete request just in case (do not check if it was actually deleted)
  await fence.do.deleteTempGoogleCreds(
    credsKey1,
    users.user0.accessTokenHeader,
  ).then(( deletionResult ) => {
    console.log(`deletionResult: ${JSON.stringify(deletionResult)}`);
    console.log(`is it an error?: ${deletionResult instanceof Error}`);
    if(deletionResult instanceof Error) {
      console.log(`Error during Google service account key deletion: ${deletionResult}`);
    }
  });

  await fence.do.deleteTempGoogleCreds(
    credsKey2,
    users.user0.accessTokenHeader,
  ).then(( deletionResult ) => {
    console.log(`deletionResult: ${JSON.stringify(deletionResult)}`);
    console.log(`is it an error?: ${deletionResult instanceof Error}`);
    if(deletionResult instanceof Error) {
      console.log(`Error during Google service account key deletion: ${deletionResult}`);
    }
  });
  */

  // Asserts
  chai.expect(
    credsList.length,
    'The expired SA keys should have been removed',
  ).to.equal(0);
});
