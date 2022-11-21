/*
 This test plan has a few pre-requisites:
 1. Google & NIH accounts.
 2. Access to the target commons environment (corresponding user entries in users.yaml
    - Google credential with "admin" access).
 3. Existing files (successfully uploaded and indexed). A portion of these files must have
    a proper ACL configuration for both Google & NIH accounts, some files need to have an
    ACL versus Project Access mismatch to test "Access Denied" scenarios.
 4. Client ID provided by developers (required for OIDC bootstrapping).
 5. Client Secret provided by developers (Used for basic auth to obtain tokens and to
    refresh the access token).
*/
Feature('Testing OIDC flow and pre-signed URL to check tokens - PXP-4649');

// To be executed with GEN3_SKIP_PROJ_SETUP=true
// No need to set up program / retrieve access token, etc.
const { execSync } = require('child_process');
const { expect } = require('chai');
const fenceProps = require('../../../services/apis/fence/fenceProps.js');
const { interactive, ifInteractive } = require('../../../utils/interactive.js');
const {
  getAccessTokenHeader,
  requestUserInput,
  parseJwt,
} = require('../../../utils/apiUtil');

// Test elaborated for DataSTAGE but it can be reused in other projects
const TARGET_ENVIRONMENT = process.env.GEN3_COMMONS_HOSTNAME || 'preprod.gen3.biodatacatalyst.nhlbi.nih.gov';

async function printOIDCFlowInstructionsAndObtainTokens(I, accountType) {
  console.log(`
            1. Using the "client id" provided, paste the following URL into the browser (replacing the CLIENT_ID placeholder accordingly):
                 https://${TARGET_ENVIRONMENT}/user/oauth2/authorize?redirect_uri=https://${TARGET_ENVIRONMENT}/user&client_id=${process.env.TEST_CLIENT_ID}&scope=openid+user+data+google_credentials&response_type=code&nonce=test-nonce-${I.cache.NONCE}
            2. Make sure you are logged in with your ${accountType} Account.
            3. On the Consent page click on the "Yes, I authorize" button.
            4. Once the user is redirected to a new page, copy the value of the "code" parameter that shows up in the URL (this code is valid for 60 seconds).
            5. [Semi-automated] Run the following curl command with basic authentication (replacing the CODE + CLIENT_ID and CLIENT_SECRET placeholders accordingly) to obtain 3 pieces of data:
               a. Access Token
               b. ID Token
               c. Refresh token
--
            % curl --user "${process.env.TEST_CLIENT_ID}:${process.env.TEST_SECRET_ID}" -X POST "https://${TARGET_ENVIRONMENT}/user/oauth2/token?grant_type=authorization_code&code=<CODE>&redirect_uri=https://${TARGET_ENVIRONMENT}/user"
            `);
  const theCode = await requestUserInput('Please paste in the code obtained in step #4 stated above: ');
  const obtainTokensCmd = `curl -s --user "${process.env.TEST_CLIENT_ID}:${process.env.TEST_SECRET_ID}" -X POST "https://${TARGET_ENVIRONMENT}/user/oauth2/token?grant_type=authorization_code&code=${theCode}&redirect_uri=https://${TARGET_ENVIRONMENT}/user"`;
  console.log(`running command: ${obtainTokensCmd}`);
  const obtainTokensCmdOut = await execSync(obtainTokensCmd, { shell: '/bin/sh' }).toString('utf8');
  console.log(`obtainTokensCmdOut: ${JSON.stringify(obtainTokensCmdOut)}`);
  const tokens = JSON.parse(obtainTokensCmdOut);
  const idTokenJson = parseJwt(tokens.id_token);
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

/*
 * nonceVal: random number to be used in one occasion (it must be unique for every iteration)
*/
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

async function fetchDIDLists(I, params = { hardcodedAuthz: null }) {
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

function performPreSignedURLTest(cloudProvider, typeOfTest, typeOfCreds) {
  Scenario(`Perform ${cloudProvider} PreSigned URL ${typeOfTest} test against DID with ${typeOfCreds} credentials @manual`, ifInteractive(
    async ({ I }) => {
      if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
      // Obtain project access list to determine which files(DIDs) the user can access
      // two lists: http 200 files and http 401 files

      const params = TARGET_ENVIRONMENT.includes('theanvil') ? { hardcodedAuthz: '/programs/CF/projects/GTEx' } : {};
      const { ok200files, unauthorized401files } = I.didList
        ? I.didList
        : await fetchDIDLists(I, params);
      console.log(`http 200 files: ${JSON.stringify(ok200files)}`);
      console.log(`http 401 files: ${JSON.stringify(unauthorized401files)}`);

      // positive: _200files | negative: _401files
      const listOfDIDs = typeOfTest === 'positive' ? ok200files : unauthorized401files;
      // AWS: s3:// | Google: gs://
      const preSignedURLPrefix = cloudProvider === 'AWS S3' ? 's3://' : 'gs://';

      console.log(`list_of_DIDs: ${JSON.stringify(listOfDIDs)}`);

      const filteredDIDs = Object.keys(listOfDIDs).reduce((filtered, key) => {
        listOfDIDs[key].urls.forEach((url) => {
          if (url.startsWith(preSignedURLPrefix)) filtered[key] = listOfDIDs[key];
        });
        return filtered;
      }, {});

      // Must have at least one sample to conduct this test
      const selectedDid = Object.keys(filteredDIDs)[0];
      // PreSignedURL request
      const signedUrlRes = await I.sendGetRequest(
        `https://${TARGET_ENVIRONMENT}/user/data/download/${selectedDid}`,
        { Authorization: `bearer ${I.cache.ACCESS_TOKEN}` },
      );

      // TODO: Run `wget` with PreSignedURL and check if md5 matches the record['md5']

      const verificationMessage = typeOfTest === 'positive' ? `
                a. The HTTP response code is Ok/200.
                b. The response contain valid URLs to the files stored in AWS S3 or GCP Buckets.` : `
                a. The HTTP response code is 401.
                b. The response contains a Fence error message.`;

      const result = await interactive(`
              1. [Automated] Selected DID [${selectedDid}] to perform a ${typeOfTest} ${cloudProvider} PreSigned URL test with ${typeOfCreds} credentials.
              2. [Automated] Executed an HTTP GET request (using the ACCESS_TOKEN provided).
              3. Verify if:${verificationMessage}
              Manual verification:
                HTTP Code: ${signedUrlRes.status}
                RESPONSE: ${JSON.stringify(signedUrlRes.data)}
      `);
      expect(result.didPass, result.details).to.be.true;
    },
  ));
}

BeforeSuite(async ({ I }) => {
  console.log('Setting up dependencies...');
  I.cache = {};

  if (process.env.TEST_CLIENT_ID === undefined) {
    throw new Error(`ERROR: There is no client_id defined for this ${TARGET_ENVIRONMENT} Test User. Please declare the "TEST_CLIENT_ID" environment variable and try again. Aborting test...`);
  } else if (process.env.TEST_SECRET_ID === undefined) {
    throw new Error(`ERROR: There is no secret_id defined for this ${TARGET_ENVIRONMENT} Test User. Please declare the "TEST_SECRET_ID" environment variable and try again. Aborting test...`);
  } else if (process.env.TEST_IMPLICIT_ID === undefined) {
    throw new Error(`ERROR: There is no implicit_id defined for this ${TARGET_ENVIRONMENT} Test User. Please declare the "TEST_IMPLICIT_ID" environment variable and try again. Aborting test...`);
  }

  I.TARGET_ENVIRONMENT = TARGET_ENVIRONMENT;
  // Fetching public list of DIDs
  const httpResp = await I.sendGetRequest(
    `https://${TARGET_ENVIRONMENT}/index/index`,
  );

  I.cache.records = httpResp.data.records;
});

// ###############################
// Scenarios with Google account
// ###############################

// Scenario #1 - Testing OIDC flow with Google credentials
Scenario('Initiate the OIDC Client flow with Google credentials to obtain the OAuth authorization code @manual', ifInteractive(
  async ({ I }) => {
    I.cache.NONCE = Date.now();
    const result = await interactive(await printOIDCFlowInstructionsAndObtainTokens(I, 'Google'));
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #2 - Verify Nonce
Scenario('Verify if the ID Token produced in the Google-OIDC scenario above has the correct nonce value @manual', ifInteractive(
  async ({ I }) => {
    const result = await runVerifyNonceScenario(I.cache.NONCE);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #3 - Controlled Access Data - Google PreSignedURL test against DID the user can't access
// TODO: internalstaging.datastage is missing a sample file for this scenario
performPreSignedURLTest('Google Storage', 'negative', 'Google');

// Scenario #4 - Controlled Access Data - Google PreSignedURL test against DID the user can access
performPreSignedURLTest('Google Storage', 'positive', 'Google');

// Scenario #5 - Controlled Access Data - Google PreSignedURL test against DID the user can't access
// TODO: internalstaging.datastage is missing a sample file for this scenario
performPreSignedURLTest('AWS S3', 'negative', 'Google');

// Scenario #6 - Controlled Access Data - Google PreSignedURL test against DID the user can access
performPreSignedURLTest('AWS S3', 'positive', 'Google');

// ###############################
// Scenarios with NIH account
// ###############################

// Scenario #7 - Starting the OIDC flow again with NIH credentials
Scenario('Initiate the OIDC Client flow with NIH credentials to obtain the OAuth authorization code @manual', ifInteractive(
  async ({ I }) => {
    I.cache.NONCE = Date.now();
    console.log('Click on the logout button so you can log back in with your NIH account.');
    // reset access token
    delete I.cache.ACCESS_TOKEN;
    const result = await interactive(await printOIDCFlowInstructionsAndObtainTokens(I, 'NIH'));
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #8 - Verify Nonce again
// Scenario #2 - Verify Nonce
Scenario('Verify if the ID Token produced in the NIH-OIDC scenario above has the correct nonce value @manual', ifInteractive(
  async ({ I }) => {
    const result = await runVerifyNonceScenario(I.cache.NONCE);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #9 - Controlled Access Data - Google PreSignedURL test against DID the user cant access
performPreSignedURLTest('Google Storage', 'negative', 'NIH');

// Scenario #10 - Controlled Access Data - Google PreSignedURL test against DID the user can access
// TODO: internalstaging.datastage is missing a sample file for this scenario
performPreSignedURLTest('Google Storage', 'positive', 'NIH');

// Scenario #11 - Controlled Access Data - Google PreSignedURL test against DID the user cant access
performPreSignedURLTest('AWS S3', 'negative', 'NIH');

// Scenario #12 - Controlled Access Data - Google PreSignedURL test against DID the user can access
performPreSignedURLTest('AWS S3', 'positive', 'NIH');

// Scenario #13 - Temporary Service Account Credentials as User
Scenario('Try to get Google Credentials as a regular user @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Copy and paste the following URL into the browser:
                 https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.googleCredentials}
            2. Expect a HTTP 401 message
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #14 - Temporary Service Account Credentials as a client
// (with an access token generated through the OIDC flow)
Scenario('Try to get Google Credentials as a client @manual', ifInteractive(
  async ({ I }) => {
    if (!I.cache.ACCESS_TOKEN) I.cache.ACCESS_TOKEN = await requestUserInput('Please provide your ACCESS_TOKEN: ');
    const httpResp = await I.sendPostRequest(
      `https://${TARGET_ENVIRONMENT}/user/credentials/google/`,
      {},
      getAccessTokenHeader(I.cache.ACCESS_TOKEN),
    );

    const result = await interactive(`
            1. [Automated] Send a HTTP POST request with the NIH user's ACCESS TOKEN to register a service account:
              HTTP POST request to: https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.googleCredentials}
            Manual verification:
              Response status: ${httpResp.status} // Expect a HTTP 200
              Response data: ${JSON.stringify(httpResp.data)}
                // Expect a JSON payload containing client information (id, email, etc.) and a private key
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #15 - Run GraphQL Query against Peregrine (Graph Model)
Scenario('Test a GraphQL query from the Web GUI @bdcat @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Login with NIH credentials
            2. Click "Query" tab
            3. Click "Switch to Graph Model" button
            4. On the left pane, enter the following query:
               {
                 project(first:0) {
                   name
                   dbgap_accession_number
                   code
                 }
               }

            Should see project(s) your NIH user has access to on the right pane:
               {
                 "data": {
                   "project": [
                     {
                       "code": "COPD_DS-CS-RD",
                       "dbgap_accession_number": "phs000179.v5.p2.c2",
                       "name": "COPD_DS-CS-RD"
                     }
                   ]
                 }
               }
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #16 - Implicit OIDC Client Flow
Scenario('Initiate the Implicit OIDC Client flow with Google credentials to obtain the OAuth authorization code @manual', ifInteractive(
  async ({ I }) => {
    I.cache.NONCE = Date.now();
    console.log(`1. Using the "Implicit id" provided, paste the following URL into the browser (replacing the CLIENT_ID placeholder accordingly):
               https://${TARGET_ENVIRONMENT}/user/oauth2/authorize?redirect_uri=https://${TARGET_ENVIRONMENT}/user&client_id=${process.env.TEST_IMPLICIT_ID}&scope=openid+user+data+google_credentials&response_type=id_token+token&nonce=test-nonce-${I.cache.NONCE}

              NOTE: you may get a 401 error invalid_request: Replay attack failed to authorize (this has to do with the nonce provided, it should be unique per request so if someone else tried with it, you may see this error. Simply change the nonce to something else.)
             // Expect a redirect with an URL containing the "id_token"`);

    const idToken = await requestUserInput('Please paste in your ID Token to verify the nonce: ');

    const result = await interactive(`
            2. [Automated] Compare nonces:
               This is the nonce from the previous step: ${I.cache.NONCE}
               And this is the nonce obtained after decoding your ID Token: ${findNonce(idToken)}
               Result: ${I.cache.NONCE === findNonce(idToken)}

            // Confirm if the numbers match.
    `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #17 - Fence public keys endpoint
Scenario('Test Fence\'s public keys endpoint @manual', ifInteractive(
  async ({ I }) => {
    const url = `https://${TARGET_ENVIRONMENT}${fenceProps.endpoints.publicKeysEndpoint}`;
    const httpResp = await I.sendGetRequest(url);

    const result = await interactive(`
            1. [Automated] Go to ${url}
            2. Should see a response like:
               {
                 keys: [
                   [
                     "fence_key_2019-06-18T19:50:41Z",
                     "-----BEGIN PUBLIC KEY----- ..."
                   ],
                   [
                     "fence_key_key-01",
                     "-----BEGIN PUBLIC KEY----- ..."
                   ]
                 ]
               }
            Manual verification:
              Response status: ${httpResp.status} // Expect a HTTP 200
              Response data: ${JSON.stringify(httpResp.data)}
                // Expect a JSON payload containing Public Key info
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #18 - Make sure custom hyperlinks are found on the portal page
Scenario('Check contact and footer links @bdcat @manual', ifInteractive(
  async ({ I }) => {
    I.amOnPage(` https://${TARGET_ENVIRONMENT}/login`);
    const contactLink = await I.grabTextFrom({ xpath: '//a[contains(@href,"https://biodatacatalyst.nhlbi.nih.gov/contact")]' });
    const foiaLink = await I.grabTextFrom({ xpath: '//a[contains(@href,"https://www.nhlbi.nih.gov/about/foia-fee-for-service-office")]' });
    const accessibilityLink = await I.grabTextFrom({ xpath: '//a[contains(@href,"https://biodatacatalyst.nhlbi.nih.gov/accessibility")]' });
    const hhsLink = await I.grabTextFrom({ xpath: '//a[contains(@href,"https://www.hhs.gov")]' });
    const nihLink = await I.grabTextFrom({ xpath: '//a[contains(@href,"https://www.nih.gov")]' });
    const nhlbiLink = await I.grabTextFrom({ xpath: '//a[contains(@href,"https://www.nhlbi.nih.gov")]' });
    const usaLink = await I.grabTextFrom({ xpath: '//a[contains(@href,"https://www.usa.gov")]' });
    const result = await interactive(`
            1. Go to /login
            2. Expect to see the following links:
            Contact form: https://biodatacatalyst.nhlbi.nih.gov/contact
            Freedom of Information Act (FOIA): https://www.nhlbi.nih.gov/about/foia-fee-for-service-office
            Accessibility: https://biodatacatalyst.nhlbi.nih.gov/accessibility/
            U.S. Department of Health & Human Services: https://www.hhs.gov/
            National Institutes of Health: https://www.nih.gov/
            National Heart, Lung, and Blood Institute: https://www.nhlbi.nih.gov/
            USA.gov: https://www.usa.gov/

            // Automated test:
            Found contact link: ${contactLink.length > 0}
            Found FOIA link: ${foiaLink.length > 0}
            Found Accessibility link: ${accessibilityLink.length > 0}
            Found HHS link: ${hhsLink.length > 0}
            Found NIH link: ${nihLink.length > 0}
            Found NHLBI link: ${nhlbiLink.length > 0}
            Found USA.gov link: ${usaLink.length > 0}
          `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #19 - Check privacy policy link
Scenario('Make sure the privacy policy link is configured @bdcat @manual', ifInteractive( // eslint-disable-line codeceptjs/no-skipped-tests
  async ({ I }) => {
    const privacyPolicyHttpResp = await I.sendGetRequest(
      `https://${TARGET_ENVIRONMENT}/user/privacy-policy`,
    );
    const result = await interactive(`
          1. Go to https://platform.sb.biodatacatalyst.nhlbi.nih.gov/
          2. Enter your Credentials to login
          3. When prompted to click "Yes, Authorize." click on "Gen3 Privacy Policy" link
          4. Expected Privacy Policy to be displayed - https://biodatacatalyst.nhlbi.nih.gov/privacy/

          // Semi-automated test:
          // Expect http status to be 200
          privacyPolicyPageStatus: ${privacyPolicyHttpResp.status}
        `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #20 - Exploration page
Scenario('Test the exploration page @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Login with NIH credentials
            2. Click "Exploration" tab
            3. Click on the "Subject" tab and make sure the faceted search is working properly:
            // Expect changes in the number of projects and subjects for each interaction with filtering controls
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #21 - Export to PFB
Scenario('Test the "Export to PFB" button from the Exploration page @manual', ifInteractive(
  async () => {
    // TODO: Parse PFB and validate it
    const result = await interactive(`
            1. Login with NIH credentials
            2. Click "Exploration" tab
            3. Click on the "Case" tab and, under "Project Id", select one of the studies (e.g.: topmed-COPD_DS-CS-RD)
            4. Click on the "Export to PFB" button. A message with the following instructions should appear:
               " Your export is in progress.
                 Please do not navigate away from this page until your export is finished. "
            5. Once the message is updated and the URL shows up, download the file and check its contents.
            6. Install and run a Python utility to validate the PFB file:
               a. Run '% pip install pypfb'
                 // Make sure you use Python2.7 (it does not support Py3 yet)
                 // You can also use Docker:
                 e.g.: % docker run -it -v /Users/marcelocostarodrigues/workspace/gen3-qa:/tmp/ quay.io/cdis/py27base:pybase2-1.0.2 /bin/sh
                   # python -m pip install pypfb

               b. Print the contents of the PFB file: 'pfb show -i ~/Downloads/<downloaded-file-name>.avro'
                 // # cd tmp/; pfb show -i export_2019-11-26T19_34_39.avro
               c. You can also try to visualize the nodes: 'pfb show -i ~/Downloads/<downloaded-file-name>.avro nodes'
                 // # cd tmp/; pfb show -i export_2019-11-26T19_34_39.avro nodes

            // Expect a valid JSON output
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #22 - Explorer `Download Manifest` button test
Scenario('Test the "Download Manifest" button from the Exploration page @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Login with NIH credentials
            2. Click "Exploration" tab
            3. Click on the "File" tab and select a project $PROJECT under "Project ID".
            4. Record the number of files selected $FILE_COUNT
            3. Click on the "Case" tab and, under "Project Id", select $PROJECT
            4. Click on the "Download Manifest" button. A 'manifest.json' file should be automatically downloaded.
            5. The manifest.json file should contain $FILE_COUNT object, or sometimes fewer. Run
            $ jq '. | length' /path/to/manifest.json
            NOTE: If there are data files that are not associated with subjects (e.g. Multisample VCFs), this number may
            be slightly smaller than $FILE_COUNT. I'm not sure how to get the exact number of expected data files :facepalm: --@mpingram
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));

// Scenario #23 - Explorer `AND/OR` toggle filter test
Scenario('Test the "AND/OR" toggle filters in the Exploration page @bdcat @manual', ifInteractive(
  async () => {
    const result = await interactive(`
            1. Login with NIH credentials
            2. Click "Exploration" tab
            3. Click on the "Project" tab and select two consent codes $CONSENT_CODES_ARRAY under "Data Use Restriction".
            4. Record the number of subjects selected $SUBJECT_COUNT. The Data Use Restriction values for all records displayed should contain one or both of the selected consent codes in $CONSENT_CODES_ARRAY.
            5. Click the gear toggle in the filter facet that displays the AND/OR toggle. Two buttons should appear. Switch the toggle from OR to AND by clicking the button labeled AND.
            6. Expect changes in the number of projects and subjects. Record the number of subjects selected $SUBJECT_COUNT_2. The number of displayed records should decrease or remain constant: $SUBJECT_COUNT >= $SUBJECT_COUNT_2. The Data Use Restriction values for all records displayed should contain both selected consent codes in $CONSENT_CODES_ARRAY.
            `);
    expect(result.didPass, result.details).to.be.true;
  },
));
