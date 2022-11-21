/* eslint-disable max-len */

const { expect } = require('chai');
const queryString = require('query-string');
const { Bash } = require('../../../utils/bash.js');
const { Gen3Response, checkPod } = require('../../../utils/apiUtil.js');

const bash = new Bash();

const I = actor();

const TARGET_ENVIRONMENT = `${process.env.NAMESPACE}.planx-pla.net`;

const scope = 'openid profile email ga4gh_passport_v1';

module.exports = {
  async runUserSyncDBGap() {
    console.log('### Running usersync job with DBGaP ...');
    console.log(`start time: ${Math.floor(Date.now() / 1000)}`);
    console.log('*** RUN USERSYNC JOB WITH DBGAP true ***');
    bash.runJob('usersync', args = 'ADD_DBGAP true'); // eslint-disable-line no-undef
    await checkPod(I, 'usersync', 'gen3job,job-name=usersync');
    console.log(`end time: ${Math.floor(Date.now() / 1000)}`);
  },

  async runUserSync() {
    console.log('### Running usersync job ...');
    console.log(`start time: ${Math.floor(Date.now() / 1000)}`);
    console.log('*** RUN USERSYNC JOB ***');
    bash.runJob('usersync');
    await checkPod(I, 'usersync', 'gen3job,job-name=usersync');
    console.log(`end time: ${Math.floor(Date.now() / 1000)}`);
  },

  async getRasToken() {
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
    const code = authCode;
    console.log(`Successfully retrieved the code from URL : ${code}`);

    // getting access_token from authCode
    console.log('Retrieving access_token ...');
    const data = queryString.stringify({
      grant_type: 'authorization_code',
      code: `${code}`,
      client_id: `${I.cache.RAS_clientID}`,
      client_secret: `${I.cache.RAS_secretID}`,
      scope: `${scope}`,
      redirect_uri: `https://${TARGET_ENVIRONMENT}/user`,
    });
    // sending request
    const getRASTokenReq = await I.sendPostRequest(
      authURL,
      data,
      {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    );
    if (getRASTokenReq.status === 200) {
      console.log('Retrieved access_token');
      I.cache.RAS_ACCESS_TOKEN = getRASTokenReq.data.access_token;
    }
    return I.cache.RAS_ACCESS_TOKEN;
  },

  async checkDbGapAccess(token) {
    // checking the user access to DbGap projects and try sending presigned url requests
    let id = null;
    console.log('### Getting the DBGap project access ...');
    const userDBGapProjectResp = await I.sendGetRequest(
      `https://${TARGET_ENVIRONMENT}/user/user`,
      { Authorization: `bearer ${token}` },
    ).then((res) => new Gen3Response(res));

    const dbGapProjectAccess = userDBGapProjectResp.body.project_access;
    const projects = Object.keys(dbGapProjectAccess)[0];
    const projectId = projects[Math.floor(Math.random() * projects.length)];
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
  },

  async presignedURLRequestS3(fence, project, projectFile, user, token) {
    let projectFileContents3 = null;
    console.log(`Creating presigned url with ${user} user for ${project} after running usersync`);
    const signedURLs3 = await fence.do.createSignedUrl(projectFile, ['protocol=s3'], token);
    if (signedURLs3.status !== 200) {
      console.log(`### The request failure status code : ${signedURLs3.status}`);
      console.log(`User ${user} with access can not create s3 signed urls and read the file for ${project}`);
    } else {
      console.log(`The presigned url for ${project} files is created. The S3 url -> ${signedURLs3.data.url}`);
      projectFileContents3 = await fence.do.getFileFromSignedUrlRes(signedURLs3);
      expect(projectFileContents3).to.equal(fence.props.awsBucketInfo.cdis_presigned_url_test.testdata);
    }
  },

  async presignedURLRequestGs(fence, project, projectFile, user, token) {
    let projectFileContentgs = null;
    console.log(`Creating presigned url with ${user} user for ${project} after running usersync`);
    const signedURLgs = await fence.do.createSignedUrl(projectFile, ['protocol=gs'], token);
    if (signedURLgs.status !== 200) {
      console.log(`### The request failure status code : ${signedURLgs.status}`);
      console.log(`User ${user} with access can not create gs signed urls and read the file for ${project}`);
    } else {
      console.log(`The presigned url for ${project} files is created. The GS url -> ${signedURLgs.data.url}`);
      projectFileContentgs = await fence.do.getFileFromSignedUrlRes(signedURLgs);
      expect(projectFileContentgs).to.equal(fence.props.googleBucketInfo.test.fileContents);
    }
  },
};
