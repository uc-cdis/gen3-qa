/*eslint-disable */
/**
 * Util providing common function for OIDC flow
 * @module oidcUtils
 */
const { expect } = require('chai');
const { execSync } = require('child_process');
const apiUtil = require('./apiUtil');
const { interactive, ifInteractive } = require('./interactive.js');
const {
  requestUserInput,
} = require('./apiUtil');



 async function printOIDCFlowInstructionsAndObtainTokens(I, accountType ,TARGET_ENVIRONMENT) {
  console.log(`
            1. Using the "client id" provided, paste the following URL into the browser (replacing the CLIENT_ID placeholder accordingly):
                 https://${TARGET_ENVIRONMENT}/user/oauth2/authorize?redirect_uri=https://${TARGET_ENVIRONMENT}&client_id=${process.env.TEST_CLIENT_ID}&scope=openid+user+data+google_credentials&response_type=code&nonce=test-nonce-${I.cache.NONCE}
            2. Make sure you are logged in with your ${accountType} Account.
            3. On the Consent page click on the "Yes, I authorize" button.
            4. Once the user is redirected to a new page, copy the value of the "code" parameter that shows up in the URL (this code is valid for 60 seconds).
            5. [Semi-automated] Run the following curl command with basic authentication (replacing the CODE + CLIENT_ID and CLIENT_SECRET placeholders accordingly) to obtain 3 pieces of data:
               a. Access Token
               b. ID Token
               c. Refresh token
--
            % curl --user "${process.env.TEST_CLIENT_ID}:${process.env.TEST_SECRET_ID}" -X POST "https://${TARGET_ENVIRONMENT}/user/oauth2/token?grant_type=authorization_code&code=<CODE>&redirect_uri=https://${TARGET_ENVIRONMENT}"
            `);
  const theCode = await apiUtil.requestUserInput('Please paste in the code obtained in step #4 stated above: ');
  const obtainTokensCmd = `curl -s --user "${process.env.TEST_CLIENT_ID}:${process.env.TEST_SECRET_ID}" -X POST "https://${TARGET_ENVIRONMENT}/user/oauth2/token?grant_type=authorization_code&code=${theCode}&redirect_uri=https://${TARGET_ENVIRONMENT}"`;
  console.log(`running command: ${obtainTokensCmd}`);
  const obtainTokensCmdOut = await execSync(obtainTokensCmd, { shell: '/bin/sh' }).toString('utf8');
  console.log(`obtainTokensCmdOut: ${JSON.stringify(obtainTokensCmdOut)}`);
  const tokens = JSON.parse(obtainTokensCmdOut);
  const idTokenJson = apiUtil.parseJwt(tokens.id_token);
  expect(idTokenJson).to.have.property('aud');
}

// Decode JWT token and find the Nonce value
function findNonce(idToken) {
  try {
    const data = idToken.split('.'); // [0] headers, [1] payload, [2] whatever
    const payload = data[1];
    const padding = '='.repeat(4 - (payload.length % 4));
    const decodedData = Buffer.from((payload + padding), 'base64').toString();
    // If the decoded data doesn't contain a nonce, that means the refresh token has expired
    const nonceStr = JSON.parse(decodedData).nonce; // output: test-nounce-<number>
    if (nonceStr === undefined) {
      return 'Could not find nonce. Make sure your id_token is not expired.';
    }
    return parseInt(nonceStr.split('-')[2], 10);
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function runVerifyNonceScenario(nonceVal) {
  const idToken = await requestUserInput('Please paste in your ID Token to verify the nonce: ');
  const result = await interactive(`
            1. [Automated] Compare nonces:
               This is the nonce from the previous scenario: ${nonceVal}
               And this is the nonce obtained after decoding your ID Token: ${findNonce(idToken)}
               Result: ${nonceVal === findNonce(idToken)}
            2. Confirm if the numbers match.
        `);
  return result;
}
function assembleCustomHeaders(ACCESS_TOKEN) {
  // Add ACCESS_TOKEN to custom headers
  return {
    Accept: 'application/json',
    Authorization: `bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };
}


async function fetchDIDLists(I, params = { hardcodedAuthz: null }, TARGET_ENVIRONMENT) {
  // TODO: Use negate_params to gather authorized (200) and blocked (401) files
  // Only assemble the didList if the list hasn't been initialized
  let projectAccessList = [];
  let authParam = 'acl';
  const httpResp = await I.sendGetRequest(
    `https://${TARGET_ENVIRONMENT}/user/user`,
    { Authorization: `bearer ${I.cache.ACCESS_TOKEN}` },
  );
  // if hardcodedAuthz is set
  // check if the program/project path is in the /user/user authz output
  const foundHardcodedAuthzInResponse = Object.keys(httpResp.data.authz).filter((a) => params.hardcodedAuthz === a).join('');
  console.log(`foundHardcodedAuthzInResponse: ${foundHardcodedAuthzInResponse}`);
  if (foundHardcodedAuthzInResponse !== '') {
    console.log('switching the lookup auth param from [acl] to [authz]');
    authParam = 'authz';
    projectAccessList = httpResp.data.authz;
  } else {
    projectAccessList = httpResp.data.project_access;
  }
  // console.log(`projectAccessList: ${projectAccessList}`);

  // initialize dict of accessible DIDs
  let ok200files = {}; // eslint-disable-line prefer-const
  // initialize dict of blocked DIDs
  let unauthorized401files = {}; // eslint-disable-line prefer-const

  // adding record DIDs to their corresponding ACL key
  // ( I.cache.records is created in BeforeSuite() )
  I.cache.records.forEach((record) => {
    // console.log('ACLs for ' + record['did'] + ' - ' + record['acl']);
    // Filtering accessible DIDs by checking if the record acl is in the project access list
    const accessibleDid = record[authParam].filter(
      (acl) => projectAccessList.hasOwnProperty(acl) || record[authParam].includes('*'), // eslint-disable-line no-prototype-builtins
    );

    // Put DIDs urls and md5 hash into their respective lists (200 or 401)
    const theFiles = accessibleDid.length > 0 ? ok200files : unauthorized401files;
    theFiles[record.did] = { urls: record.urls, md5: record.md5 };
  });

  // the cache
  I.didList = {};
  I.didList.ok200files = ok200files;
  I.didList.unauthorized401files = unauthorized401files;

  return I.didList;
}

// async function fetchDIDLists(I ,TARGET_ENVIRONMENT) {
//   // Only assemble the didList if the list hasn't been initialized
//   if (!I.didList) {
//     const httpResp = await I.sendGetRequest(
//       `https://${TARGET_ENVIRONMENT}/user/user`,
//       { Authorization: `bearer ${I.cache.ACCESS_TOKEN}` },
//     ).then((res) => new Gen3Response(res));

//     const projectAccessList = httpResp.body.project_access;

//     // initialize dict of accessible DIDs
//     let ok200files = {}; // eslint-disable-line prefer-const
//     // initialize dict of blocked DIDs
//     let unauthorized401files = {}; // eslint-disable-line prefer-const

//     // assemble 200 authorized ids
//     const authorized200Project = ['*'];
//     for (const i in projectAccessList) { // eslint-disable-line guard-for-in
//       authorized200Project.push(i);
//     }
//     console.log(`Authorized project : ${JSON.stringify(authorized200Project)}`);

//     for (const project of authorized200Project) {
//       const record200Resp = await I.sendGetRequest(
//         `https://${TARGET_ENVIRONMENT}/index/index?acl=${project}&limit=1`,
//       );
//       if ((record200Resp.data.records.length) === 0) {
//         console.log('No Record/DID');
//       } else {
//         ok200files[record200Resp.data.records[0].did] = {
//           urls: record200Resp.data.records[0].urls,
//         };
//       }
//     }

//     console.log(`GUID selected: ${I.cache.GUID}`);
//     // assemble 401 unauthorized ids
//     const record401Resp = await I.sendGetRequest(
//       `https://${TARGET_ENVIRONMENT}/index/index/${I.cache.GUID}`,
//     );
//     unauthorized401files[record401Resp.data.did] = { urls: record401Resp.data.urls };

//     console.log(`http 200 files: ${JSON.stringify(ok200files)}`);
//     console.log(`http 401 files: ${JSON.stringify(unauthorized401files)}`);

//     I.didList = {};
//     I.didList.ok200files = ok200files;
//     I.didList.unauthorized401files = unauthorized401files;

//     return I.didList;
//   }
//   return I.didList;
// }

//
// function performPreSignedURLTest(cloudProvider, typeOfTest, typeOfCreds , TARGET_ENVIRONMENT) {
//   Scenario(`Perform ${cloudProvider} PreSigned URL ${typeOfTest} test against DID with ${typeOfCreds} credentials @manual`, ifInteractive(
//     async ({ I }) => {
//       if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
//       // Obtain project access list to determine which files(DIDs) the user can access
//       // two lists: http 200 files and http 401 files

//       const params = TARGET_ENVIRONMENT.includes('theanvil') ? { hardcodedAuthz: '/programs/CF/projects/GTEx' } : {};
//       const { ok200files, unauthorized401files } = I.didList
//         ? I.didList
//         : await fetchDIDLists(I, params,TARGET_ENVIRONMENT);
//       console.log(`http 200 files: ${JSON.stringify(ok200files)}`);
//       console.log(`http 401 files: ${JSON.stringify(unauthorized401files)}`);

//       // positive: _200files | negative: _401files
//       const listOfDIDs = typeOfTest === 'positive' ? ok200files : unauthorized401files;
//       // AWS: s3:// | Google: gs://
//       const preSignedURLPrefix = cloudProvider === 'AWS S3' ? 's3://' : 'gs://';

//       console.log(`list_of_DIDs: ${JSON.stringify(listOfDIDs)}`);

//       const filteredDIDs = Object.keys(listOfDIDs).reduce((filtered, key) => {
//         listOfDIDs[key].urls.forEach((url) => {
//           if (url.startsWith(preSignedURLPrefix)) filtered[key] = listOfDIDs[key];
//         });
//         return filtered;
//       }, {});

//       // Must have at least one sample to conduct this test
//       const selectedDid = Object.keys(filteredDIDs)[0];
//       // PreSignedURL request
//       const signedUrlRes = await I.sendGetRequest(
//         `https://${TARGET_ENVIRONMENT}/user/data/download/${selectedDid}`,
//         { Authorization: `bearer ${I.cache.ACCESS_TOKEN}` },
//       );

//       // TODO: Run `wget` with PreSignedURL and check if md5 matches the record['md5']

//       const verificationMessage = typeOfTest === 'positive' ? `
//                   a. The HTTP response code is Ok/200.
//                   b. The response contain valid URLs to the files stored in AWS S3 or GCP Buckets.` : `
//                   a. The HTTP response code is 401.
//                   b. The response contains a Fence error message.`;

//       const result = await interactive(`
//                 1. [Automated] Selected DID [${selectedDid}] to perform a ${typeOfTest} ${cloudProvider} PreSigned URL test with ${typeOfCreds} credentials.
//                 2. [Automated] Executed an HTTP GET request (using the ACCESS_TOKEN provided).
//                 3. Verify if:${verificationMessage}
//                 Manual verification:
//                   HTTP Code: ${signedUrlRes.status}
//                   RESPONSE: ${JSON.stringify(signedUrlRes.data)}
//         `);
//       expect(result.didPass, result.details).to.be.true;
//     },
//   ));
// }

function performPreSignedURLTest(cloudProvider, typeOfTest, typeOfCreds) {
  Scenario(`Perform ${cloudProvider} PreSigned URL ${typeOfTest} test against DID with ${typeOfCreds} credentials DID@manual`, ifInteractive(
    async ({ I, fence }) => {
      const filteredDIDs = {};
      if (I.cache.ACCESS_TOKEN) {
        // Obtain project access list to determine which files(DIDs) the user can access
        // two lists: http 200 files and http 401 files
        const { ok200files, unauthorized401files } = await fetchDIDLists(I);

        const listOfDIDs = typeOfTest === 'positive' ? ok200files : unauthorized401files;
        console.log('####');
        console.log(`The Selected List of DIDs : ${JSON.stringify(listOfDIDs)}`);

        // AWS: s3:// | Google: gs://
        const preSignedURLPrefix = cloudProvider === 'AWS S3' ? 's3://' : 'gs://';

        for (const key in listOfDIDs) { // eslint-disable-line guard-for-in
          listOfDIDs[key].urls.forEach((url) => { // eslint-disable-line no-loop-func
            if (url.startsWith(preSignedURLPrefix)) filteredDIDs[key] = url;
          });
        }
      }

      console.log('####');
      console.log(filteredDIDs);

      // selecting random key DID from the list
      const keys = Object.keys(filteredDIDs);
      const selectedDid = keys[Math.floor(Math.random() * keys.length)];
      console.log(`#### Selected DID : ${JSON.stringify(selectedDid)}`);
      // PreSignedURL request
      const signedUrlRes = await fence.do.createSignedUrl(
        `${selectedDid}`,
        [],
        assembleCustomHeaders(I.cache.ACCESS_TOKEN),
      );

      const verificationMessage = typeOfTest === 'positive' ? `
                a. The HTTP response code is Ok/200.
                b. The response contain valid URLs to the files stored in AWS S3 or GCP Buckets.` : `
                a. The HTTP response code is 401.
                b. The response contains a Fence error message.`;

      const result = await interactive(`
              1. [Automated] Selected DID [${selectedDid}] to perform a ${typeOfTest} ${cloudProvider} PreSigned URL test.
              2. [Automated] Executed an HTTP GET request (using the ACCESS_TOKEN provided).
              3. Verify if:${verificationMessage}
              Manual verification:
                HTTP Code: ${signedUrlRes.status}
                RESPONSE: ${JSON.stringify(signedUrlRes.body) || signedUrlRes.parsedFenceError}
      `);
      expect(result.didPass, result.details).to.be.true;
    },
  ));
}

exports.printOIDCFlowInstructionsAndObtainTokens = printOIDCFlowInstructionsAndObtainTokens;
exports.performPreSignedURLTest = performPreSignedURLTest;
exports.fetchDIDLists = fetchDIDLists;
exports.assembleCustomHeaders = assembleCustomHeaders;
exports.findNonce = findNonce;
exports.runVerifyNonceScenario = runVerifyNonceScenario;