/* eslint-disable max-len */
/*
Steps for configuration ->
1. get sftp server from devops
(DONE -
    endpoint - http://s-5745d53f10e1421eb.server.transfer.us-east-1.amazonaws.com
    user - qa-dcf
    home directory: /sftp-test-binamb/qa-dcf
    ssh in qa-dcp and run sftp qa-dcf@s-5745d53f10e1421eb.server.transfer.us-east-1.amazonaws.com )
    Also add the the public key of the usersync pod to the sftp server 'ADD KEY' in aws console
    2. update the fence-config.yaml [NOTE - leave encrypted to false and 'PROJECT-12345': [''] this is important or else usersync adds /programs in the project.]
(DONE -
    dbGaP
     - info:
      host: 's-5745d53f10e1421eb.server.transfer.us-east-1.amazonaws.com'
      username: 'qa-dcf'
      password: ''
      port: 22
      proxy: 'cloud-proxy.internal.io'
      proxy_user: 'sftpuser'
      #decrypt_key: 'NCBI-DBGAP-TrustedPartner'
      encrypted: false
      study_to_resource_namespaces:
        '_default': ['/']
    allow_non_dbGaP_whitelist: true
    allowed_whitelist_patterns: ['authentication_file_PROJECT-(\d*).(csv|txt)', 'authentication_file_NCI-(\d*).(csv|txt)']
    protocol: 'sftp'
    decrypt_key: 'KEY'
    parse_consent_code: true
)
3. create whitelist files and upload to sftp server via `put <file_name>` [NOTE : authentication_file_PROJECT-12345.csv should match the config pattern.]
( file example -
[positive test files]
authentication_file_PROJECT-12345.csv
user name,login,project_id
UCtestuser121,UCtestuser121,PROJECT-12345
main@example.org,main@example.org,PROJECT-12345

authentication_file_PROJECT-67890.csv
user name,login,project_id
UCtestuser121,UCtestuser121,PROJECT-67890

[negative test files]
(NOTE - creation of presigned url will fail, as the fence-config does not include the project name FAIL_00000)
authentication_file_FAIL_00000.csv
user name,login,project_id
UCtestuser121,UCtestuser121,FAIL_00000
UCtestuser122,UCtestuser122,FAIL_00000
)
4. Add RAS user UCtestuser121 and password as env variable
*/

/*
Test Steps -
1. Upload the whitelist files to the sftp server (already uploaded in sftp server)
2. check if the files are available in the sftp server (check before moving forward with the test, if not available fail the test)
3. create indexd records with CUSTOM Project IDs
4. trying creating presigned url with that indexd records
5. run usersync job (`gen3 job run usersync ADD_DBGAP true`)
6. check the userinfor if the user has correct permissions
7. also check if the user has access top dbGap and non-dbGap projects/permissions
8. create presigned url - (positive and negative scenarios)
*/

Feature('nonDBGap Project Usersync @requires-fence @requires-indexd');

const { expect } = require('chai');
const { Bash } = require('../../utils/bash.js');

const bash = new Bash();

const I = actor();

const indexdFiles = {
  project12345File: {
    filename: 'testdata',
    size: 10,
    md5: 'e5c9a0d417f65226f564f438120381c5', // pragma: allowlist secret
    urls: [
      's3://cdis-presigned-url-test/testdata',
      'gs://dcf-integration-test/file.txt',
    ],
    authz: ['/programs/PROJECT-12345'],
    acl: ['PROJECT-12345'],
    form: 'object',
  },
  project67890File: {
    filename: 'testdata',
    size: 15,
    md5: 'e5c9a0d417f65226f564f438120381c5', // pragma: allowlist secret
    urls: [
      's3://cdis-presigned-url-test/testdata',
      'gs://dcf-integration-test/file.txt',
    ],
    authz: ['/programs/PROJECT-67890'],
    acl: ['PROJECT-67890'],
    form: 'object',
  },
  fail00000File: {
    filename: 'testdata',
    size: 9,
    md5: 'e5c9a0d417f65226f564f438120381c5', // pragma: allowlist secret
    urls: [
      's3://cdis-presigned-url-test/testdata',
      'gs://dcf-integration-test/file.txt',
    ],
    authz: ['/FAIL_00000'],
    acl: ['FAIL_00000'],
    form: 'object',
  },
};

BeforeSuite(async ({ indexd }) => {
  I.cache = {};
  // access token for main.Acct
  I.cache.ACCESS_TOKEN = await bash.runCommand('gen3 api access-token main@example.org');

  // for the OIDC flow, need clientID and secretID for login
  I.cache.RAS_clientID = process.env.clientID;
  I.cache.RAS_secretID = process.env.secretID;

  console.log('#### Uploading indexd files ...');
  // upload the indexd files
  const filesUpload = await indexd.do.addFileIndices(Object.values(indexdFiles));
  expect(
    filesUpload, 'Unable to add files to indexd as part of setup',
  ).to.be.true;
});

AfterSuite(async ({ indexd }) => {
  console.log('#### Deleting the indexd files ...');
  // delete multiple files form indexd
  try {
    await indexd.do.deleteFileIndices(Object.values(indexdFiles));
  } catch (error) {
    console.log(error);
  }
});

// user main Acct - main@example.org
Scenario('PresignedUrl with google mainAcct @nondbgapUsersyncTest', async ({ fence, users, nondbgap }) => {
  // checking presigned url before running usersync
  console.log('creating presigned url with mainAcct user for PROJECT-12345 before running usersync.');
  const signedUrlProject12345BeforeUserSync = await fence.do.createSignedUrl(indexdFiles.project12345File.did, ['protocol=s3'], users.mainAcct.accessTokenHeader);
  if (signedUrlProject12345BeforeUserSync.data.status !== 200) {
    console.log(`${users.mainAcct.username} can not create presigned URL for project 12345 file`);
  }
  console.log('creating presigned url with mainAcct user for PROJECT-67890 before running usersync.');
  const signedUrlProject67890BeforeUserSync = await fence.do.createSignedUrl(indexdFiles.project67890File.did, ['protocol=gs'], users.user0.accessTokenHeader);
  if (signedUrlProject67890BeforeUserSync.data.status !== 200) {
    console.log(`${users.user0.username} can not create presigned URL for project 67890 file`);
  }

  // run the usersync wth DBGap = true
  await nondbgap.do.runUserSyncDBGap();

  // checking presigned url after running usersync
  // project 12345 with mainAcct user
  console.log('### mainAcct has access to PROJECT-12345 in the whitelist. This test should pass');
  await nondbgap.do.presignedURLRequestS3(fence, 'PROJECT-12345', indexdFiles.project12345File.did, users.mainAcct.username, users.mainAcct.accessTokenHeader);
  // project 67890 with mainAcct user
  console.log('### mainAcct does not have access to PROJECT-67890 in the whitelist. This test should not pass');
  await nondbgap.do.presignedURLRequestGs(fence, 'PROJECT-67890', indexdFiles.project67890File.did, users.mainAcct.username, users.mainAcct.accessTokenHeader);

  // project 12345 with user0 user
  console.log('### user0 does not have access to PROJECT-12345 in the whitelist. This test should not pass');
  await nondbgap.do.presignedURLRequestS3(fence, 'PROJECT-12345', indexdFiles.project12345File.did, users.user0.username, users.user0.accessTokenHeader);
  // project 67890 with user0 user
  console.log('### user0 has access to PROJECT-67890 in the whitelist. This test should pass');
  await nondbgap.do.presignedURLRequestGs(fence, 'PROJECT-67890', indexdFiles.project67890File.did, users.user0.username, users.user0.accessTokenHeader);

  // project FAIL_00000 , user shouldnt have access to project files
  const signedURLFail00000 = await fence.do.createSignedUrl(indexdFiles.fail00000File.did, users.mainAcct.accessTokenHeader);
  if (signedURLFail00000.data.status !== 200) {
    console.log('Cannot create presigned urls for project FAIL_00000 file');
  }

  // checking if the user still has access to dbGap projects
  console.log(`Checking if the user ${users.mainAcct.username} still has access to dbGap projects`);
  const dbGapProjectDID = await nondbgap.do.checkDbGapAccess(users.mainAcct.accessTokenHeader);
  const dbGpProjectAccess = await fence.do.createSignedUrl(dbGapProjectDID, users.mainAcct.accessTokenHeader);
  if (dbGpProjectAccess.data.status === 200) {
    console.log(`The presigned url for project 12345 files is created. The URL -> ${dbGpProjectAccess.data.urls}`);
  }

  // running usersync job after the test
  await nondbgap.do.runUserSync();
});

// commenting out the RAS scenario below as we arent sure how to handle 2FA auth app from RAS in the test

// Scenario('Presigned Url with RAS user @nondbgapUsersyncTest', async ({ fence, users, nondbgap }) => {
//   // carry out the OIDC flow and get the access token for RAS user
//   const rasAccessToken = await nondbgap.do.getRasToken();
//   // checking presigned url before running usersync
//   console.log('creating presigned url with RAS UCtestuser121 user for PROJECT-12345 before running usersync.');
//   const signedUrlProject12345BeforeUserSync = await fence.do.createSignedUrl(indexdFiles.project12345File, rasAccessToken);
//   if (signedUrlProject12345BeforeUserSync.data.status !== 200) {
//     console.log(`${users.mainAcct.username} can not create presigned URL for project 12345 file`);
//   }
//   console.log('creating presigned url with mainAcct user for PROJECT-67890 before running usersync.');
//   const signedUrlProject67890BeforeUserSync = await fence.do.createSignedUrl(indexdFiles.project67890File, rasAccessToken);
//   if (signedUrlProject67890BeforeUserSync.data.status !== 200) {
//     console.log(`${users.mainAcct.username} can not create presigned URL for project 67890 file`);
//   }

//   // run the usersync with DBGap = true
//   await nondbgap.do.runUserSyncDBGap();

//   // checking presigned url after running usersync
//   // project 12345 with RAS user
//   await nondbgap.do.presignedURLRequest(fence, 'PROJECT-12345', indexdFiles.project12345File, 'UCtestuser121', rasAccessToken);

//   // project 67890 with RAS user
//   await nondbgap.do.presignedURLRequest(fence, 'PROJECT-67890', indexdFiles.project67890File, 'UCtestuser121', rasAccessToken);

//   // project FAIL_00000 , user shouldnt have access to project files
//   const signedURLFail00000 = await fence.do.createSignedUrl(indexdFiles.fail00000File, rasAccessToken);
//   if (signedURLFail00000.data.status !== 200) {
//     console.log('Cannot create presigned urls for project FAIL_00000 file');
//   }

//   // checking if the user still has access to dbGap projects
//   console.log(`Checking if the user ${users.mainAcct.username} still has access to dbGap projects`);
//   const dbGapProjectDID = await nondbgap.do.checkDbGapAccess(rasAccessToken);
//   const dbGpProjectAccess = await fence.do.createSignedUrl(dbGapProjectDID, rasAccessToken);
//   if (dbGpProjectAccess.data.status === 200) {
//     console.log(`The presigned url for project 12345 files is created. The URL -> ${dbGpProjectAccess.data.urls}`);
//   }

//   // running usersync job after the test
//   await nondbgap.do.runUserSync();
// });
