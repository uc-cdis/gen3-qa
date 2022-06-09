/*
Steps for configuration ->
1. get sftp server from devops 
(DONE - 
    endpoint - http://s-5745d53f10e1421eb.server.transfer.us-east-1.amazonaws.com
    user - qa-dcf
    home directory: /sftp-test-binamb/qa-dcf
    ssh in qa-dcp and run sftp qa-dcp@http://s-5745d53f10e1421eb.server.transfer.us-east-1.amazonaws.com )
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
        'PROJECT-12345': ['']
        'PROJECT-67890': ['']
    allow_non_dbgap_whitelist: true
    allowed_id_patterns: ["PROJECT-.*"]
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
cdis.autotest@gmail.com,cdis.autotest@gmail.com,PROJECT-12345  

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

const chai = require('chai');
const { Bash } = require('../../utils/bash.js');
const user = require('../../utils/user.js');
const queryString = require('query-string');
 
const fs = require('fs');

const bash = new Bash();

const I = actor();

const scope = 'openid profile email ga4gh_passport_v1';

const TARGET_ENVIRONMENT = `${process.env.NAMESPACE}.planx-pla.net`;

const indexd_files = {
    project12345_file:{
        filename: 'testdata',
        size: 10,
        hashes: {
            md5: 'e5c9a0d417f65226f564f438120381c5' // pragma: allowlist secret
        },
        urls: [
            's3://cdis-presigned-url-test/testdata',
            'gs://dcf-integration-test/file.txt'
        ],
        authz: ['/PROJECT-12345'],
        acl: ['PROJECT-12345'],
        form: 'object',
    },
    project67890_file:{
        filename: 'testdata',
        size: 15,
        hashes: {
            md5: 'e5c9a0d417f65226f564f438120381c5' // pragma: allowlist secret
        },
        urls: [
            's3://cdis-presigned-url-test/testdata',
            'gs://dcf-integration-test/file.txt'
        ],
        authz: ['/PROJECT-67890'],
        acl: ['PROJECT-67890'],
        form: 'object',
    },
    fail00000_file:{
        filename: 'testdata',
        size: 9,
        hashes: {
            md5: 'e5c9a0d417f65226f564f438120381c5' // pragma: allowlist secret
        },
        urls: [
            's3://cdis-presigned-url-test/testdata',
            'gs://dcf-integration-test/file.txt'
        ],
        authz: ['/FAIL_00000'],
        acl: ['FAIL_00000'],
        form: 'object',
    },
};

async function runUserSyncDBGap() {
    console.log('### Running usersync job with DBGap ...');
    console.log(`start time: ${Math.floor(Date.now() / 1000)}`);
    bash.runJob('usersync', args = 'ADD_DBGAP true');
    await checkPod(I, 'usersync', 'gen3job,job-name=usersync');
    console.log(`end time: ${Math.floor(Date.now() / 1000)}`);
}

async function runUserSync(){
    console.log('### Running usersync job ...');
    console.log(`start time: ${Math.floor(Date.now() / 1000)}`);
    bash.runJob('usersync');
    await checkPod(I, 'usersync', 'gen3job,job-name=usersync');
    console.log(`end time: ${Math.floor(Date.now() / 1000)}`);
} 

async function getRasToken() {
    console.log('### Getting auth code ...');
    const authURL = '/user/oauth2/authorize?'
        + 'response_type=code'
        + `&client_id=${I.cache.RAS_clientID}`
        + `&redirect_uri=https://${TARGET_ENVIRONMENT}/user`
        + `&scope=${scope}`
        + '&idp=ras';
    I.amOnPage(authURL);
    // filling the RAS login form
    I.fillField('USER', process.env.RAS_TEST_USER_1_USERNAME);
    I.fillField('PASSWORD', process.env.RAS_TEST_USER_1_PASSWORD);
    I.waitForElement({ xpath: 'xpath: //button[contains(text(), \'Sign in\')]' });
    I.click({ xpath: 'xpath: //button[contains(text(), \'Sign in\')]' });
    I.saveScreenshot('AfterSignIn.png');
    // checking if the authcode is present in the url after login
    I.seeInCurrentURL('code');
    // grabbing the authcode from the url and storing it in the variable
    const authCodeURL = await I.grabCurrentUrl();
    const url = new URL(authCodeURL);
    const authCode = url.searchParams.get('code');
    // check if the authCode isnt empty
    expect(authCode).to.not.to.be.empty;
    let code = authCode;
    console.log(`Successfully retrieved the code from URL : ${code}`);

    // getting access_token from authCode
    console.log('Retrieving access_token ...');
    const data = queryString.stringify({
        grant_type: 'authorization_code',
        code: `${code}`,
        client_id: `${I.cache.RAS_clientID}`,
        client_secret: `${I.cache.RAS_secretID}`,
        scope: `${scope}`,
        redirect_uri: 'https://${TARGET_ENVIRONMENT}/user',
    });
    // sending request
    const getRASToken = await I.sendPostRequest(
        rasAuthURL,
        data,
        {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      );
    if (getRasToken.status === 200) {
        I.cache.RAS_ACCESS_TOKEN = getRASToken.data.access_token;
        return I.cache.RAS_ACCESS_TOKEN;
    } else {
        console.log('The Request was unsuccessful');
    }

}

async function checkDbGapAccess(token) {
    // checking the user access to DbGap projects and try sending presigned url requests
    console.log('### Getting the DBGap project access ...');
    const userDBGapProjectResp = await I.sendGetRequest(
        `https://${TARGET_ENVIRONMENT}/user/user`,
        { Authorization: `bearer ${token}` },    
    ).then((res) => new Gen3Response(res));

    const dbGapProjectAccess = userDBGapProjectResp.body.project_access;
    const projects = Object.keys(dbGapProjectAccess)[0];
    const projectId = projects[Math.floor(Math.random() * keys.length)];
    // get index records for the acl project 
    const indexdRecordDID = await I.sendGetRequest(
        `https://${TARGET_ENVIRONMENT}/index/index?acl=${projectId}`,
        { Authorization: `bearer ${token}` },    
    );
    // select the first indexd record
    if ((indexdRecordDID.data.records.length) > 0) {
        id = indexdRecordDID.data.records[0].id;
    }
    // return the id
    return id;
}

async function presignedURLRequest(project, projectFile, user, token) {
    console.log(`Creating presigned url with mainAcct user for ${project} after running usersync`);
    const signedURLs3 = await fence.do.createSignedUrl(projectFile, ['protocol=s3'], token);
    if (signedURLs3.data.status === 200) {
        console.log(`The presigned url for ${project} files is created. The S3 url -> ${signedURLs3.data.urls}`)
    };
    const signedURLgs = await fence.do.createSignedUrl(projectFile, ['protocol=gs'], token);
    if (signedURLgs.data.status === 200) {
        console.log(`The presigned url for ${project} files is created. The GS url -> ${signedURLgs.data.urls}`)
    };

    let projectFileContents3 = null;
    let projectFileContentgs = null;

    try {
        projectFileContents3 = await fence.do.getFileFromSignedUrlRes(signedURLs3);
    } catch (err) {
        console.log('Failed to fetch presigned url', err);
    }

    try {
        projectFileContentgs = await fence.do.getFileFromSignedUrlRes(signedURLgs);
    } catch (err) {
        console.log('Failed to fetch presigned url', err);
    }
    
    chai.expect(projectFileContents3, `User ${user} with access can not create s3 signed urls ` 
        + `and read the file for ${project}`).to.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
    chai.expect(projectFileContentgs , `User ${user} with access can not create gs signed urls `
        + `and read the file for ${project}`).to.equal(fence.props.googleBucketInfo.test.fileContents);    
}

BeforeSuite(async ({ I, indexd }) => {
    I.cache = {};
    // access token for main.Acct
    I.cache.ACCESS_TOKEN = await bash.runCommand('gen3 api access-token cdis.autotest@gmail.com');

    // for the OIDC flow, need clientID and secretID for login
    I.cache.RAS_clientID = process.env.clientID;
    I.cache.RAS_secretID = process.env.secretID;

    console.log('#### Uploading indexd files ...');
    // upload the indexd files
    const filesUpload = await indexd.do.addFileIndices(Object.values(indexd_files));
    chai.expect(
        filesUpload, 'Unable to add files to indexd as part of setup'
    ).to.be.true;

});

AfterSuite(async ({ I, indexd }) => {
    console.log('#### Deleting the indexd files ...');
    // delete multiple files form indexd 
    await indexd.do.deleteFileIndices(Object.values(indexd_files));
});

// user main Acct - cdis.autotest@gmail.com
Scenario('PresignedUrl with google mainAcct', async ({ fence }) => {
    // checking presigned url before running usersync
    console.log('creating presigned url with mainAcct user for PROJECT-12345 before running usersync.');
    const signedUrlProject12345BeforeUserSync = await fence.do.createSignedUrl(indexd_files.project12345_file, user.mainAcct.accessTokenHeader);
    if (signedUrlProject12345BeforeUserSync.data.status !== 200) {
        console.log(`${users.mainAcct.username} can not create presigned URL for project 12345 file`);
    };
    console.log('creating presigned url with mainAcct user for PROJECT-67890 before running usersync.');
    const signedUrlProject67890BeforeUserSync = await fence.do.createSignedUrl(indexd_files.project67890_file, user.mainAcct.accessTokenHeader);
    if (signedUrlProject67890BeforeUserSync.data.status !== 200) {
        console.log(`${users.mainAcct.username} can not create presigned URL for project 67890 file`);
    }
    
    // run the usersync wth DBGap = true
    runUserSyncDBGap();

    // checking presigned url after running usersync
    // project 12345 with mainAcct user
    presignedURLRequest(PROJECT-12345, indexd_files.project12345_file, users.mainAcct.username, user.mainAcct.accessTokenHeader);
    
    // project 67890 with mainAcct user
    presignedURLRequest(PROJECT-67890, indexd_files.project67890_file, users.mainAcct.username, user.mainAcct.accessTokenHeader);

    // project FAIL_00000 , user shouldnt have access to project files
    const signedURLFail00000 = await fence.do.createSignedUrl(indexd_files.fail00000_file, user.mainAcct.accessTokenHeader);
    if (signedURLFail00000.data.status !== 200) {
        console.log('Cannot create presigned urls for project FAIL_00000 file');
    };

    // checking if the user still has access to dbGap projects
    console.log(`Checking if the user ${users.mainAcct.username} still has access to dbGap projects`);
    const dbGapProjectDID = await checkDbGapAccess(user.mainAcct.accessTokenHeader);
    const dbGpProjectAccess = await fence.do.createSignedUrl(dbGapProjectDID, user.mainAcct.accessTokenHeader);
    if (dbGpProjectAccess.data.status === 200) {
        console.log(`The presigned url for project 12345 files is created. The URL -> ${dbGpProjectAccess.data.urls}`)
    };

    // running usersync job after the test
    runUserSync();
});

Scenario('Presigned Url with RAS user', async ({ fence }) => {
    // carry out the OIDC flow and get the access token for RAS user
    const rasAccessToken = await getRasToken();
    // checking presigned url before running usersync
    console.log('creating presigned url with RAS UCtestuser121 user for PROJECT-12345 before running usersync.');
    const signedUrlProject12345BeforeUserSync = await fence.do.createSignedUrl(indexd_files.project12345_file, rasAccessToken);
    if (signedUrlProject12345BeforeUserSync.data.status !== 200) {
        console.log(`${users.mainAcct.username} can not create presigned URL for project 12345 file`);
    };
    console.log('creating presigned url with mainAcct user for PROJECT-67890 before running usersync.');
    const signedUrlProject67890BeforeUserSync = await fence.do.createSignedUrl(indexd_files.project67890_file, rasAccessToken);
    if (signedUrlProject67890BeforeUserSync.data.status !== 200) {
        console.log(`${users.mainAcct.username} can not create presigned URL for project 67890 file`);
    }
    
    // run the usersync with DBGap = true
    runUserSyncDBGap();

    // checking presigned url after running usersync
    // project 12345 with RAS user
    presignedURLRequest(PROJECT-12345, indexd_files.project12345_file, UCtestuser121, rasAccessToken);

    // project 67890 with RAS user
    presignedURLRequest(PROJECT-67890, indexd_files.project67890_file, UCtestuser121, rasAccessToken);

    // project FAIL_00000 , user shouldnt have access to project files
    const signedURLFail00000 = await fence.do.createSignedUrl(indexd_files.fail00000_file, rasAccessToken);
    if (signedURLFail00000.data.status !== 200) {
        console.log('Cannot create presigned urls for project FAIL_00000 file');
    };

    // checking if the user still has access to dbGap projects
    console.log(`Checking if the user ${users.mainAcct.username} still has access to dbGap projects`);
    const dbGapProjectDID = await checkDbGapAccess(rasAccessToken);
    const dbGpProjectAccess = await fence.do.createSignedUrl(dbGapProjectDID, rasAccessToken);
    if (dbGpProjectAccess.data.status === 200) {
        console.log(`The presigned url for project 12345 files is created. The URL -> ${dbGpProjectAccess.data.urls}`)
    };
    
    // running usersync job after the test
    runUserSync();
});